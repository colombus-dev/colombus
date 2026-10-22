import ast
import uuid

from app.models.parser import ParserSubgraph, ParserSubgraphLine
from app.parsers.base import BaseMLParser

#### TODO: adapted from https://github.com/sumonbis/DS-Pipeline below


class DSPipelinesParser(BaseMLParser):
    def __init__(self):
        super().__init__()
        self.__subgraphs: list[ParserSubgraph] = []

    def parse_code(
        self, python_code: str, parse_subscript: bool = True
    ) -> list[ParserSubgraph]:
        tree = ast.parse(python_code)
        visitor = FuncLister(parse_subscript=parse_subscript)
        visitor.s_list = []
        visitor.f_name = []
        visitor.f_dict = {}
        visitor.symb_dict = {}
        visitor.arg_arr = []
        visitor.symb_arr = []
        visitor.visit(tree)

        edges: list[tuple[int, int]] = []
        pipe: list[str] = []

        for i in range(len(visitor.s_list)):
            ins = list(set(visitor.arg_arr[i]))
            for j in ins:
                found = False
                for k in range(i - 1, -1, -1):
                    for sym in visitor.symb_arr[k]:
                        if j == sym:
                            edges.append((k, i))
                            found = True
                            break
                    if found:
                        break

            rec: list[dict] = []
            self.build_pipe(visitor.s_list[i], visitor.f_dict, pipe, rec)

        computed_subgraphs = [*self.__subgraphs]
        self.__subgraphs.clear()
        return computed_subgraphs

    def build_pipe(self, elem, dict, pipe, rec):
        if elem["root"].startswith("9"):
            # if custom function call
            func_name = elem["root"][1:]
            if len(dict[func_name]) > 0:
                for ss in dict[func_name]:
                    if len(rec) < 100:
                        rec.append(ss)
                        self.build_pipe(ss, dict, pipe, rec)
                rec = []
        elif (len(pipe) == 0) or (pipe[-1] != elem):
            pipe.append(elem["root"])
            splitted_libfunc = elem["api"].split(".")
            self.__subgraphs.append(
                ParserSubgraph(
                    id=str(uuid.uuid4()),
                    library="",
                    function=splitted_libfunc[-1].split(" ")[0],
                    value={},
                    source=ast.unparse(elem["node"]),
                    line=ParserSubgraphLine(
                        start=elem["node"].lineno,
                        end=elem["node"].end_lineno,
                    ),
                    step_name="",
                )
            )


class FuncLister(ast.NodeVisitor):
    trailler = ""
    isClass = False
    isFunc = 0

    symb_dict: dict[str, str] = {}
    s_list: list[dict] = []
    f_name: list[str] = []
    f_dict: dict[str, list[dict]] = {}
    arg_arr: list[list[str] | str] = []
    symb_arr: list[list[str] | str] = []
    symb: list[str] = []

    def __init__(self, parse_subscript: bool = True) -> None:
        super().__init__()
        self.parse_subscript = parse_subscript

    def visit_ClassDef(self, node) -> None:
        self.generic_visit(node)

    def visit_FunctionDef(self, node) -> None:
        self.isFunc += 1
        self.f_name.append(node.name)
        self.f_dict[self.f_name[-1]] = []
        self.generic_visit(node)
        self.f_name.pop()
        self.isFunc -= 1

    def visit_Assign(self, node) -> None:
        self.symb = []
        sym = ""
        for target in node.targets:
            if isinstance(target, ast.Tuple):
                for e in target.elts:
                    sym = self.getSymbol(e)
                    self.symb.append(sym)
                    self.symb_dict[sym] = "-"
            else:
                sym = self.getSymbol(target)
                self.symb.append(sym)
                self.symb_dict[sym] = "-"
        self.generic_visit(node)
        self.symb = []

    def getSymbol(self, target) -> str:
        if isinstance(target, ast.Name):
            return target.id
        elif isinstance(target, ast.Subscript):
            if (
                isinstance(target.value, ast.Name)
                and isinstance(target.slice, ast.Index)
                and isinstance(target.value, ast.Name)
            ):
                return target.value.id + "[" + target.value.id + "]"
            return "?"
        elif isinstance(target, ast.Attribute):
            return target.attr
        else:
            return "?"

    def visit_Call(self, node) -> None:
        api = ""
        ar = ""
        arg = []
        if isinstance(node.func, ast.Name):
            try:
                arg = FuncLister.get_args(node)
                ar = str(arg)
            except:  # noqa: E722
                ar = "[?]"
            api_name = str(node.func.id)
            if api_name.endswith("app.run"):
                api_name = "main"
            api = api_name + " " + ar

        elif isinstance(node.func, ast.Attribute):
            n = node.func
            FuncLister.trailler = ""
            AttrLister().visit(n)
            tr = FuncLister.trailler
            if tr.endswith("app.run"):
                tr = "main"
            try:
                arg = FuncLister.get_args(node)
                ar = str(arg)
            except:  # noqa: E722
                ar = "[?]"
            api = tr + " " + ar

        if api != "":
            root = Utils.get_root(api, self.f_dict.keys())

            # TODO: implement this condition in the profiling function
            # if s == "0" or s == "8":
            #     pass
            # else:
            if self.isFunc > 0:
                self.f_dict[self.f_name[-1]].append(
                    {"root": root, "node": node, "api": api}
                )
            else:
                self.s_list.append({"root": root, "node": node, "api": api})
                self.arg_arr.append(arg)
                self.symb_arr.append(self.symb)

        self.generic_visit(node)

    def visit_Subscript(self, node):
        # ADDED
        if self.parse_subscript:
            if isinstance(node.value, ast.Name):
                self.s_list.append({"root": "", "node": node, "api": "subscript"})
                self.arg_arr.append("")
                self.symb_arr.append("")
            elif isinstance(node.value, ast.Attribute):
                self.s_list.append({"root": "", "node": node, "api": "subscript"})
                self.arg_arr.append("")
                self.symb_arr.append("")
        self.generic_visit(node)

    @staticmethod
    def get_args(node) -> list[str]:
        a = []
        b = []
        for arg in node.args:
            if isinstance(arg, ast.Starred):
                a.append(arg.value.id)  # type: ignore
            # elif isinstance(arg, ast.Str):
            elif isinstance(arg, ast.BinOp):
                a.append(
                    Utils.get_val(arg.left)
                    + Utils.get_bin_op(arg.op)
                    + Utils.get_val(arg.right)
                )
            else:
                a.append(Utils.get_val(arg))
                if isinstance(arg, ast.Name):
                    b.append(Utils.get_val(arg))  ###
        for kw in node.keywords:
            if isinstance(kw, ast.keyword):
                if kw.arg is None:
                    a.append("**" + kw.value.id)  # type: ignore
                else:
                    a.append(kw.arg + "=" + Utils.get_val(kw.value))
        return b


class AttrLister(ast.NodeVisitor):
    def visit_Attribute(self, node) -> None:
        if isinstance(node.value, ast.Attribute):
            if FuncLister.trailler == "":
                FuncLister.trailler = node.attr
            else:
                FuncLister.trailler = node.attr + "." + FuncLister.trailler
        if isinstance(node.value, ast.Name):
            if FuncLister.trailler == "":
                FuncLister.trailler = node.value.id + "." + node.attr
            else:
                FuncLister.trailler = (
                    node.value.id + "." + node.attr + "." + FuncLister.trailler
                )
        self.generic_visit(node)


class Utils:
    @classmethod
    def get_val(cls, node) -> str:
        if isinstance(node, ast.Num):
            return str(node.n)
        elif isinstance(node, ast.Str):
            return str(node.s)
        elif isinstance(node, ast.Name):
            return str(node.id)
        elif isinstance(node, ast.NameConstant):
            return str(node.value)
        elif isinstance(node, ast.Call):
            return "CALL"
        elif isinstance(node, ast.Subscript):
            return str(
                cls.get_val(node.value)
            )  # + handle subcript Slice(Index, Slice or ExtSlice)
        elif isinstance(node, ast.Attribute):
            FuncLister.trailler = ""
            AttrLister().visit(node)
            return FuncLister.trailler
        elif isinstance(node, ast.List):
            return str(cls.get_elts(node))
        elif isinstance(node, ast.Tuple):
            return str(cls.get_elts(node))
        else:
            return "UNKNOWN"

    @classmethod
    def get_elts(cls, node) -> str:
        a = []
        for e in node.elts:
            a.append(cls.get_val(e))
        return str(a)

    @classmethod
    def get_bin_op(cls, node) -> str:
        if isinstance(node, ast.Add):
            return " + "
        elif isinstance(node, ast.Sub):
            return " - "
        elif isinstance(node, ast.Mult):
            return " * "
        elif isinstance(node, ast.Div):
            return " / "
        elif isinstance(node, ast.FloorDiv):
            return " // "
        elif isinstance(node, ast.Mod):
            return " % "
        elif isinstance(node, ast.Pow):
            return " ** "
        elif isinstance(node, ast.LShift):
            return " << "
        elif isinstance(node, ast.RShift):
            return " >> "
        elif isinstance(node, ast.BitAnd):
            return " B_AND "
        elif isinstance(node, ast.BitOr):
            return " B_OR "
        elif isinstance(node, ast.BitXor):
            return " B_XOR "
        else:
            assert False

    @classmethod
    def get_root(cls, api, fs) -> str:
        # TODO: add doc
        name = api.split(" [")[0]
        parts = name.split(".")
        root = parts[-1]

        if root in fs:
            s = "9" + root
            return s
        return root
