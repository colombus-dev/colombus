from abc import ABC, abstractmethod
from functools import cached_property
from itertools import pairwise
from typing import Any, Literal, Self
from uuid import uuid4

from pydantic import BaseModel, model_validator


class SQLPatternContext:
    def __init__(self):
        self.todo: str | None = None
        self.agg: list[tuple[str, str]] = []

    def register(self, op_uuid: str):
        self.agg.append((self.todo, op_uuid))
        self.todo = None


class Component(ABC):

    @abstractmethod
    def fill_select_context(self): ...

    @abstractmethod
    def fill_from_join_context(self): ...

    @abstractmethod
    def fill_where_context(self): ...

    @abstractmethod
    def fill_where_position_context(self, ctx: SQLPatternContext): ...


class RegexOperand(BaseModel, Component):
    name: str
    _uuid: int | None = None

    def fill_select_context(self):
        if self.name == ".":
            return
        yield f"s{self._uuid}.cross_db_uuid"

    def fill_from_join_context(self):
        if self.name == ".":
            return
        yield f"INNER JOIN step AS s{self._uuid} ON p.id = s{self._uuid}.profile_id"

    def fill_where_context(self):
        if self.name == ".":
            return
        yield f's{self._uuid}.name = "{self.name}"'

    def fill_where_position_context(self, ctx: SQLPatternContext):
        # ctx.register(self._uuid)
        ctx.register(self.name)

    def pretty_print(self):
        return f'"{self.name}"' if self.name != "." else self.name


class RegexQuantifier(BaseModel, Component):
    group_name: str | None = None
    quantifier: Literal["*", "+", "|"]
    operands: list[Self | RegexOperand]

    @cached_property
    def uuid(self):
        return uuid4().hex

    def iterate_leaves(self):
        for op in self.operands:
            if not isinstance(op, RegexOperand):
                yield from op.iterate_leaves()
                continue
            yield op

    def init_leaves_uuid(self):
        for leave in self.iterate_leaves():
            match self.quantifier:
                case "|":
                    leave._uuid = self.uuid
                case _:
                    leave._uuid = uuid4().hex

    def fill_select_context(self):
        match self.quantifier:
            case "|":
                yield from self.operands[0].fill_select_context()
            case _:
                for op in self.operands:
                    yield from op.fill_select_context()

    def fill_from_join_context(self):
        match self.quantifier:
            case "|":
                yield from self.operands[0].fill_from_join_context()
            case _:
                for op in self.operands:
                    yield from op.fill_from_join_context()

    def fill_where_context(self):
        match self.quantifier:
            case "|":
                yield " OR ".join(
                    c for op in self.operands for c in op.fill_where_context()
                )
            case _:
                for op in self.operands:
                    yield from op.fill_where_context()

    def fill_where_position_context(self, ctx: SQLPatternContext):
        # 'MyPattern= [.]* -> ["Library Loading" | "Data Preparation"]+ -> [grp-betw-ld=([.]*)] -> ["Library Loading"]+'
        match self.quantifier:
            case "|":
                # ctx.register(self.uuid)
                ctx.register(next(self.iterate_leaves()).name)
            case "*":
                ctx.todo = ">="
                for op in self.operands:
                    op.fill_where_position_context(ctx)
            case "+":
                ctx.todo = ">"
                for op in self.operands:
                    op.fill_where_position_context(ctx)

    def pretty_print(self):
        res = f" {self.quantifier} ".join(o.pretty_print() for o in self.operands)
        if len(self.operands) == 1:
            res = f"[{res}]{self.quantifier}"
        if self.group_name:
            res = f"[{self.group_name}=({res})]"
        return res


class Pattern(BaseModel, Component):
    name: str
    expression: list[RegexQuantifier]

    def init_leaves_uuid(self):
        for expr in self.expression:
            expr.init_leaves_uuid()

    def fill_select_context(self):
        yield "SELECT DISTINCT p.name"
        yield ", ".join(
            c for expr in self.expression for c in expr.fill_select_context()
        )
        yield "FROM profile AS p"

    def fill_from_join_context(self):
        for expr in self.expression:
            yield from expr.fill_from_join_context()

    def fill_where_context(self):
        yield "WHERE"
        yield " AND ".join(
            c for expr in self.expression for c in expr.fill_where_context()
        )

    def fill_where_position_context(self, ctx):
        # yield " AND ".join(
        #     f"s{leave._uuid}.position - s{next_leave._uuid}.position = 1"
        #     for leave, next_leave in pairwise(
        #         leave for expr in self.expression for leave in expr.iterate_leaves()
        #     )
        # )
        for expr in self.expression:
            expr.fill_where_position_context(ctx)

    def pretty_print(self):
        return f"{self.name}= " + " -> ".join(e.pretty_print() for e in self.expression)
