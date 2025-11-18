// Generated from ./CanopusDSL.g4 by ANTLR 4.13.2
// jshint ignore: start
import antlr4 from "antlr4";
import CanopusDSLListener from "./CanopusDSLListener.js";

const serializedATN = [
	4, 1, 19, 102, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2,
	5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 1, 0, 4, 0, 22, 8, 0,
	11, 0, 12, 0, 23, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2,
	1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 3, 2, 47, 8,
	2, 1, 3, 1, 3, 1, 3, 5, 3, 52, 8, 3, 10, 3, 12, 3, 55, 9, 3, 1, 4, 1, 4, 3, 4,
	59, 8, 4, 1, 5, 1, 5, 1, 5, 1, 5, 4, 5, 65, 8, 5, 11, 5, 12, 5, 66, 1, 5, 1,
	5, 1, 5, 1, 5, 1, 5, 1, 5, 5, 5, 75, 8, 5, 10, 5, 12, 5, 78, 9, 5, 1, 5, 1, 5,
	1, 5, 1, 5, 3, 5, 84, 8, 5, 1, 6, 1, 6, 1, 7, 1, 7, 1, 7, 5, 7, 91, 8, 7, 10,
	7, 12, 7, 94, 9, 7, 1, 8, 1, 8, 1, 8, 1, 8, 1, 9, 1, 9, 1, 9, 0, 0, 10, 0, 2,
	4, 6, 8, 10, 12, 14, 16, 18, 0, 2, 2, 0, 10, 10, 18, 18, 2, 0, 2, 2, 11, 11,
	103, 0, 21, 1, 0, 0, 0, 2, 27, 1, 0, 0, 0, 4, 46, 1, 0, 0, 0, 6, 48, 1, 0, 0,
	0, 8, 56, 1, 0, 0, 0, 10, 83, 1, 0, 0, 0, 12, 85, 1, 0, 0, 0, 14, 87, 1, 0, 0,
	0, 16, 95, 1, 0, 0, 0, 18, 99, 1, 0, 0, 0, 20, 22, 3, 2, 1, 0, 21, 20, 1, 0,
	0, 0, 22, 23, 1, 0, 0, 0, 23, 21, 1, 0, 0, 0, 23, 24, 1, 0, 0, 0, 24, 25, 1,
	0, 0, 0, 25, 26, 5, 0, 0, 1, 26, 1, 1, 0, 0, 0, 27, 28, 5, 1, 0, 0, 28, 29, 5,
	14, 0, 0, 29, 30, 5, 2, 0, 0, 30, 31, 3, 4, 2, 0, 31, 3, 1, 0, 0, 0, 32, 33,
	5, 12, 0, 0, 33, 34, 5, 3, 0, 0, 34, 35, 3, 6, 3, 0, 35, 36, 5, 3, 0, 0, 36,
	37, 5, 13, 0, 0, 37, 47, 1, 0, 0, 0, 38, 39, 5, 12, 0, 0, 39, 40, 5, 3, 0, 0,
	40, 47, 3, 6, 3, 0, 41, 42, 3, 6, 3, 0, 42, 43, 5, 3, 0, 0, 43, 44, 5, 13, 0,
	0, 44, 47, 1, 0, 0, 0, 45, 47, 3, 6, 3, 0, 46, 32, 1, 0, 0, 0, 46, 38, 1, 0,
	0, 0, 46, 41, 1, 0, 0, 0, 46, 45, 1, 0, 0, 0, 47, 5, 1, 0, 0, 0, 48, 53, 3, 8,
	4, 0, 49, 50, 5, 3, 0, 0, 50, 52, 3, 8, 4, 0, 51, 49, 1, 0, 0, 0, 52, 55, 1,
	0, 0, 0, 53, 51, 1, 0, 0, 0, 53, 54, 1, 0, 0, 0, 54, 7, 1, 0, 0, 0, 55, 53, 1,
	0, 0, 0, 56, 58, 3, 10, 5, 0, 57, 59, 3, 12, 6, 0, 58, 57, 1, 0, 0, 0, 58, 59,
	1, 0, 0, 0, 59, 9, 1, 0, 0, 0, 60, 61, 5, 4, 0, 0, 61, 64, 3, 14, 7, 0, 62,
	63, 5, 5, 0, 0, 63, 65, 3, 14, 7, 0, 64, 62, 1, 0, 0, 0, 65, 66, 1, 0, 0, 0,
	66, 64, 1, 0, 0, 0, 66, 67, 1, 0, 0, 0, 67, 68, 1, 0, 0, 0, 68, 69, 5, 6, 0,
	0, 69, 84, 1, 0, 0, 0, 70, 71, 5, 7, 0, 0, 71, 76, 3, 16, 8, 0, 72, 73, 5, 8,
	0, 0, 73, 75, 3, 16, 8, 0, 74, 72, 1, 0, 0, 0, 75, 78, 1, 0, 0, 0, 76, 74, 1,
	0, 0, 0, 76, 77, 1, 0, 0, 0, 77, 79, 1, 0, 0, 0, 78, 76, 1, 0, 0, 0, 79, 80,
	5, 9, 0, 0, 80, 84, 1, 0, 0, 0, 81, 84, 5, 14, 0, 0, 82, 84, 5, 18, 0, 0, 83,
	60, 1, 0, 0, 0, 83, 70, 1, 0, 0, 0, 83, 81, 1, 0, 0, 0, 83, 82, 1, 0, 0, 0,
	84, 11, 1, 0, 0, 0, 85, 86, 7, 0, 0, 0, 86, 13, 1, 0, 0, 0, 87, 92, 3, 10, 5,
	0, 88, 89, 5, 3, 0, 0, 89, 91, 3, 10, 5, 0, 90, 88, 1, 0, 0, 0, 91, 94, 1, 0,
	0, 0, 92, 90, 1, 0, 0, 0, 92, 93, 1, 0, 0, 0, 93, 15, 1, 0, 0, 0, 94, 92, 1,
	0, 0, 0, 95, 96, 5, 15, 0, 0, 96, 97, 3, 18, 9, 0, 97, 98, 5, 16, 0, 0, 98,
	17, 1, 0, 0, 0, 99, 100, 7, 1, 0, 0, 100, 19, 1, 0, 0, 0, 8, 23, 46, 53, 58,
	66, 76, 83, 92,
];

const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map(
	(ds, index) => new antlr4.dfa.DFA(ds, index),
);

const sharedContextCache = new antlr4.atn.PredictionContextCache();

export default class CanopusDSLParser extends antlr4.Parser {
	static grammarFileName = "CanopusDSL.g4";
	static literalNames = [
		null,
		"'pattern'",
		"'='",
		"'->'",
		"'('",
		"'|'",
		"')'",
		"'['",
		"','",
		"']'",
		"'+'",
		"'!='",
		"'start'",
		"'end'",
		null,
		null,
		null,
		null,
		"'*'",
	];
	static symbolicNames = [
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		"START_OP",
		"END_OP",
		"ID",
		"LABEL",
		"STRING",
		"WS",
		"WILDCARD",
		"COMMENT",
	];
	static ruleNames = [
		"program",
		"patternDef",
		"patternExpr",
		"middleExpr",
		"multipExpr",
		"primary",
		"multipOperator",
		"expr",
		"condition",
		"comparator",
	];

	constructor(input) {
		super(input);
		this._interp = new antlr4.atn.ParserATNSimulator(
			this,
			atn,
			decisionsToDFA,
			sharedContextCache,
		);
		this.ruleNames = CanopusDSLParser.ruleNames;
		this.literalNames = CanopusDSLParser.literalNames;
		this.symbolicNames = CanopusDSLParser.symbolicNames;
	}

	program() {
		const localctx = new ProgramContext(this, this._ctx, this.state);
		this.enterRule(localctx, 0, CanopusDSLParser.RULE_program);
		var _la = 0;
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 21;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				this.state = 20;
				this.patternDef();
				this.state = 23;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while (_la === 1);
			this.state = 25;
			this.match(CanopusDSLParser.EOF);
		} catch (re) {
			if (re instanceof antlr4.error.RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		} finally {
			this.exitRule();
		}
		return localctx;
	}

	patternDef() {
		const localctx = new PatternDefContext(this, this._ctx, this.state);
		this.enterRule(localctx, 2, CanopusDSLParser.RULE_patternDef);
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 27;
			this.match(CanopusDSLParser.T__0);
			this.state = 28;
			this.match(CanopusDSLParser.ID);
			this.state = 29;
			this.match(CanopusDSLParser.T__1);
			this.state = 30;
			this.patternExpr();
		} catch (re) {
			if (re instanceof antlr4.error.RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		} finally {
			this.exitRule();
		}
		return localctx;
	}

	patternExpr() {
		const localctx = new PatternExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 4, CanopusDSLParser.RULE_patternExpr);
		try {
			this.state = 46;
			this._errHandler.sync(this);
			// biome-ignore lint/correctness/noInnerDeclarations: autogenerated by ANTLR4
			var la_ = this._interp.adaptivePredict(this._input, 1, this._ctx);
			switch (la_) {
				case 1:
					this.enterOuterAlt(localctx, 1);
					this.state = 32;
					this.match(CanopusDSLParser.START_OP);
					this.state = 33;
					this.match(CanopusDSLParser.T__2);
					this.state = 34;
					this.middleExpr();
					this.state = 35;
					this.match(CanopusDSLParser.T__2);
					this.state = 36;
					this.match(CanopusDSLParser.END_OP);
					break;

				case 2:
					this.enterOuterAlt(localctx, 2);
					this.state = 38;
					this.match(CanopusDSLParser.START_OP);
					this.state = 39;
					this.match(CanopusDSLParser.T__2);
					this.state = 40;
					this.middleExpr();
					break;

				case 3:
					this.enterOuterAlt(localctx, 3);
					this.state = 41;
					this.middleExpr();
					this.state = 42;
					this.match(CanopusDSLParser.T__2);
					this.state = 43;
					this.match(CanopusDSLParser.END_OP);
					break;

				case 4:
					this.enterOuterAlt(localctx, 4);
					this.state = 45;
					this.middleExpr();
					break;
			}
		} catch (re) {
			if (re instanceof antlr4.error.RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		} finally {
			this.exitRule();
		}
		return localctx;
	}

	middleExpr() {
		const localctx = new MiddleExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 6, CanopusDSLParser.RULE_middleExpr);
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 48;
			this.multipExpr();
			this.state = 53;
			this._errHandler.sync(this);
			// biome-ignore lint/correctness/noInnerDeclarations: autogenerated by ANTLR4
			var _alt = this._interp.adaptivePredict(this._input, 2, this._ctx);
			// biome-ignore lint/suspicious/noDoubleEquals: autogenerated by ANTLR4
			while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					this.state = 49;
					this.match(CanopusDSLParser.T__2);
					this.state = 50;
					this.multipExpr();
				}
				this.state = 55;
				this._errHandler.sync(this);
				_alt = this._interp.adaptivePredict(this._input, 2, this._ctx);
			}
		} catch (re) {
			if (re instanceof antlr4.error.RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		} finally {
			this.exitRule();
		}
		return localctx;
	}

	multipExpr() {
		const localctx = new MultipExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 8, CanopusDSLParser.RULE_multipExpr);
		var _la = 0;
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 56;
			this.primary();
			this.state = 58;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === 10 || _la === 18) {
				this.state = 57;
				this.multipOperator();
			}
		} catch (re) {
			if (re instanceof antlr4.error.RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		} finally {
			this.exitRule();
		}
		return localctx;
	}

	primary() {
		let localctx = new PrimaryContext(this, this._ctx, this.state);
		this.enterRule(localctx, 10, CanopusDSLParser.RULE_primary);
		var _la = 0;
		try {
			this.state = 83;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
				case 4:
					localctx = new AlternativeExprContext(this, localctx);
					this.enterOuterAlt(localctx, 1);
					this.state = 60;
					this.match(CanopusDSLParser.T__3);
					this.state = 61;
					this.expr();
					this.state = 64;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					do {
						this.state = 62;
						this.match(CanopusDSLParser.T__4);
						this.state = 63;
						this.expr();
						this.state = 66;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
					} while (_la === 5);
					this.state = 68;
					this.match(CanopusDSLParser.T__5);
					break;
				case 7:
					localctx = new ElementExprContext(this, localctx);
					this.enterOuterAlt(localctx, 2);
					this.state = 70;
					this.match(CanopusDSLParser.T__6);
					this.state = 71;
					this.condition();
					this.state = 76;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					while (_la === 8) {
						this.state = 72;
						this.match(CanopusDSLParser.T__7);
						this.state = 73;
						this.condition();
						this.state = 78;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
					}
					this.state = 79;
					this.match(CanopusDSLParser.T__8);
					break;
				case 14:
					localctx = new IdContext(this, localctx);
					this.enterOuterAlt(localctx, 3);
					this.state = 81;
					this.match(CanopusDSLParser.ID);
					break;
				case 18:
					localctx = new WildcardContext(this, localctx);
					this.enterOuterAlt(localctx, 4);
					this.state = 82;
					this.match(CanopusDSLParser.WILDCARD);
					break;
				default:
					throw new antlr4.error.NoViableAltException(this);
			}
		} catch (re) {
			if (re instanceof antlr4.error.RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		} finally {
			this.exitRule();
		}
		return localctx;
	}

	multipOperator() {
		const localctx = new MultipOperatorContext(this, this._ctx, this.state);
		this.enterRule(localctx, 12, CanopusDSLParser.RULE_multipOperator);
		var _la = 0;
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 85;
			_la = this._input.LA(1);
			if (!(_la === 10 || _la === 18)) {
				this._errHandler.recoverInline(this);
			} else {
				this._errHandler.reportMatch(this);
				this.consume();
			}
		} catch (re) {
			if (re instanceof antlr4.error.RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		} finally {
			this.exitRule();
		}
		return localctx;
	}

	expr() {
		const localctx = new ExprContext(this, this._ctx, this.state);
		this.enterRule(localctx, 14, CanopusDSLParser.RULE_expr);
		var _la = 0;
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 87;
			this.primary();
			this.state = 92;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === 3) {
				this.state = 88;
				this.match(CanopusDSLParser.T__2);
				this.state = 89;
				this.primary();
				this.state = 94;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
		} catch (re) {
			if (re instanceof antlr4.error.RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		} finally {
			this.exitRule();
		}
		return localctx;
	}

	condition() {
		const localctx = new ConditionContext(this, this._ctx, this.state);
		this.enterRule(localctx, 16, CanopusDSLParser.RULE_condition);
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 95;
			this.match(CanopusDSLParser.LABEL);
			this.state = 96;
			this.comparator();
			this.state = 97;
			this.match(CanopusDSLParser.STRING);
		} catch (re) {
			if (re instanceof antlr4.error.RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		} finally {
			this.exitRule();
		}
		return localctx;
	}

	comparator() {
		const localctx = new ComparatorContext(this, this._ctx, this.state);
		this.enterRule(localctx, 18, CanopusDSLParser.RULE_comparator);
		var _la = 0;
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 99;
			_la = this._input.LA(1);
			if (!(_la === 2 || _la === 11)) {
				this._errHandler.recoverInline(this);
			} else {
				this._errHandler.reportMatch(this);
				this.consume();
			}
		} catch (re) {
			if (re instanceof antlr4.error.RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		} finally {
			this.exitRule();
		}
		return localctx;
	}
}

CanopusDSLParser.EOF = antlr4.Token.EOF;
CanopusDSLParser.T__0 = 1;
CanopusDSLParser.T__1 = 2;
CanopusDSLParser.T__2 = 3;
CanopusDSLParser.T__3 = 4;
CanopusDSLParser.T__4 = 5;
CanopusDSLParser.T__5 = 6;
CanopusDSLParser.T__6 = 7;
CanopusDSLParser.T__7 = 8;
CanopusDSLParser.T__8 = 9;
CanopusDSLParser.T__9 = 10;
CanopusDSLParser.T__10 = 11;
CanopusDSLParser.START_OP = 12;
CanopusDSLParser.END_OP = 13;
CanopusDSLParser.ID = 14;
CanopusDSLParser.LABEL = 15;
CanopusDSLParser.STRING = 16;
CanopusDSLParser.WS = 17;
CanopusDSLParser.WILDCARD = 18;
CanopusDSLParser.COMMENT = 19;

CanopusDSLParser.RULE_program = 0;
CanopusDSLParser.RULE_patternDef = 1;
CanopusDSLParser.RULE_patternExpr = 2;
CanopusDSLParser.RULE_middleExpr = 3;
CanopusDSLParser.RULE_multipExpr = 4;
CanopusDSLParser.RULE_primary = 5;
CanopusDSLParser.RULE_multipOperator = 6;
CanopusDSLParser.RULE_expr = 7;
CanopusDSLParser.RULE_condition = 8;
CanopusDSLParser.RULE_comparator = 9;

class ProgramContext extends antlr4.ParserRuleContext {
	constructor(parser, parent, invokingState) {
		if (parent === undefined) {
			parent = null;
		}
		if (invokingState === undefined || invokingState === null) {
			invokingState = -1;
		}
		super(parent, invokingState);
		this.parser = parser;
		this.ruleIndex = CanopusDSLParser.RULE_program;
	}

	EOF() {
		return this.getToken(CanopusDSLParser.EOF, 0);
	}

	patternDef = function (i) {
		if (i === undefined) {
			i = null;
		}
		if (i === null) {
			return this.getTypedRuleContexts(PatternDefContext);
		} else {
			return this.getTypedRuleContext(PatternDefContext, i);
		}
	};

	enterRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.enterProgram(this);
		}
	}

	exitRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.exitProgram(this);
		}
	}
}

class PatternDefContext extends antlr4.ParserRuleContext {
	constructor(parser, parent, invokingState) {
		if (parent === undefined) {
			parent = null;
		}
		if (invokingState === undefined || invokingState === null) {
			invokingState = -1;
		}
		super(parent, invokingState);
		this.parser = parser;
		this.ruleIndex = CanopusDSLParser.RULE_patternDef;
	}

	ID() {
		return this.getToken(CanopusDSLParser.ID, 0);
	}

	patternExpr() {
		return this.getTypedRuleContext(PatternExprContext, 0);
	}

	enterRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.enterPatternDef(this);
		}
	}

	exitRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.exitPatternDef(this);
		}
	}
}

class PatternExprContext extends antlr4.ParserRuleContext {
	constructor(parser, parent, invokingState) {
		if (parent === undefined) {
			parent = null;
		}
		if (invokingState === undefined || invokingState === null) {
			invokingState = -1;
		}
		super(parent, invokingState);
		this.parser = parser;
		this.ruleIndex = CanopusDSLParser.RULE_patternExpr;
	}

	START_OP() {
		return this.getToken(CanopusDSLParser.START_OP, 0);
	}

	middleExpr() {
		return this.getTypedRuleContext(MiddleExprContext, 0);
	}

	END_OP() {
		return this.getToken(CanopusDSLParser.END_OP, 0);
	}

	enterRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.enterPatternExpr(this);
		}
	}

	exitRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.exitPatternExpr(this);
		}
	}
}

class MiddleExprContext extends antlr4.ParserRuleContext {
	constructor(parser, parent, invokingState) {
		if (parent === undefined) {
			parent = null;
		}
		if (invokingState === undefined || invokingState === null) {
			invokingState = -1;
		}
		super(parent, invokingState);
		this.parser = parser;
		this.ruleIndex = CanopusDSLParser.RULE_middleExpr;
	}

	multipExpr = function (i) {
		if (i === undefined) {
			i = null;
		}
		if (i === null) {
			return this.getTypedRuleContexts(MultipExprContext);
		} else {
			return this.getTypedRuleContext(MultipExprContext, i);
		}
	};

	enterRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.enterMiddleExpr(this);
		}
	}

	exitRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.exitMiddleExpr(this);
		}
	}
}

class MultipExprContext extends antlr4.ParserRuleContext {
	constructor(parser, parent, invokingState) {
		if (parent === undefined) {
			parent = null;
		}
		if (invokingState === undefined || invokingState === null) {
			invokingState = -1;
		}
		super(parent, invokingState);
		this.parser = parser;
		this.ruleIndex = CanopusDSLParser.RULE_multipExpr;
	}

	primary() {
		return this.getTypedRuleContext(PrimaryContext, 0);
	}

	multipOperator() {
		return this.getTypedRuleContext(MultipOperatorContext, 0);
	}

	enterRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.enterMultipExpr(this);
		}
	}

	exitRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.exitMultipExpr(this);
		}
	}
}

class PrimaryContext extends antlr4.ParserRuleContext {
	constructor(parser, parent, invokingState) {
		if (parent === undefined) {
			parent = null;
		}
		if (invokingState === undefined || invokingState === null) {
			invokingState = -1;
		}
		super(parent, invokingState);
		this.parser = parser;
		this.ruleIndex = CanopusDSLParser.RULE_primary;
	}

	copyFrom(ctx) {
		super.copyFrom(ctx);
	}
}

class AlternativeExprContext extends PrimaryContext {
	constructor(parser, ctx) {
		super(parser);
		super.copyFrom(ctx);
	}

	expr = function (i) {
		if (i === undefined) {
			i = null;
		}
		if (i === null) {
			return this.getTypedRuleContexts(ExprContext);
		} else {
			return this.getTypedRuleContext(ExprContext, i);
		}
	};

	enterRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.enterAlternativeExpr(this);
		}
	}

	exitRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.exitAlternativeExpr(this);
		}
	}
}

CanopusDSLParser.AlternativeExprContext = AlternativeExprContext;

class ElementExprContext extends PrimaryContext {
	constructor(parser, ctx) {
		super(parser);
		super.copyFrom(ctx);
	}

	condition = function (i) {
		if (i === undefined) {
			i = null;
		}
		if (i === null) {
			return this.getTypedRuleContexts(ConditionContext);
		} else {
			return this.getTypedRuleContext(ConditionContext, i);
		}
	};

	enterRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.enterElementExpr(this);
		}
	}

	exitRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.exitElementExpr(this);
		}
	}
}

CanopusDSLParser.ElementExprContext = ElementExprContext;

class IdContext extends PrimaryContext {
	constructor(parser, ctx) {
		super(parser);
		super.copyFrom(ctx);
	}

	ID() {
		return this.getToken(CanopusDSLParser.ID, 0);
	}

	enterRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.enterId(this);
		}
	}

	exitRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.exitId(this);
		}
	}
}

CanopusDSLParser.IdContext = IdContext;

class WildcardContext extends PrimaryContext {
	constructor(parser, ctx) {
		super(parser);
		super.copyFrom(ctx);
	}

	WILDCARD() {
		return this.getToken(CanopusDSLParser.WILDCARD, 0);
	}

	enterRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.enterWildcard(this);
		}
	}

	exitRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.exitWildcard(this);
		}
	}
}

CanopusDSLParser.WildcardContext = WildcardContext;

class MultipOperatorContext extends antlr4.ParserRuleContext {
	constructor(parser, parent, invokingState) {
		if (parent === undefined) {
			parent = null;
		}
		if (invokingState === undefined || invokingState === null) {
			invokingState = -1;
		}
		super(parent, invokingState);
		this.parser = parser;
		this.ruleIndex = CanopusDSLParser.RULE_multipOperator;
	}

	WILDCARD() {
		return this.getToken(CanopusDSLParser.WILDCARD, 0);
	}

	enterRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.enterMultipOperator(this);
		}
	}

	exitRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.exitMultipOperator(this);
		}
	}
}

class ExprContext extends antlr4.ParserRuleContext {
	constructor(parser, parent, invokingState) {
		if (parent === undefined) {
			parent = null;
		}
		if (invokingState === undefined || invokingState === null) {
			invokingState = -1;
		}
		super(parent, invokingState);
		this.parser = parser;
		this.ruleIndex = CanopusDSLParser.RULE_expr;
	}

	primary = function (i) {
		if (i === undefined) {
			i = null;
		}
		if (i === null) {
			return this.getTypedRuleContexts(PrimaryContext);
		} else {
			return this.getTypedRuleContext(PrimaryContext, i);
		}
	};

	enterRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.enterExpr(this);
		}
	}

	exitRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.exitExpr(this);
		}
	}
}

class ConditionContext extends antlr4.ParserRuleContext {
	constructor(parser, parent, invokingState) {
		if (parent === undefined) {
			parent = null;
		}
		if (invokingState === undefined || invokingState === null) {
			invokingState = -1;
		}
		super(parent, invokingState);
		this.parser = parser;
		this.ruleIndex = CanopusDSLParser.RULE_condition;
	}

	LABEL() {
		return this.getToken(CanopusDSLParser.LABEL, 0);
	}

	comparator() {
		return this.getTypedRuleContext(ComparatorContext, 0);
	}

	STRING() {
		return this.getToken(CanopusDSLParser.STRING, 0);
	}

	enterRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.enterCondition(this);
		}
	}

	exitRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.exitCondition(this);
		}
	}
}

class ComparatorContext extends antlr4.ParserRuleContext {
	constructor(parser, parent, invokingState) {
		if (parent === undefined) {
			parent = null;
		}
		if (invokingState === undefined || invokingState === null) {
			invokingState = -1;
		}
		super(parent, invokingState);
		this.parser = parser;
		this.ruleIndex = CanopusDSLParser.RULE_comparator;
	}

	enterRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.enterComparator(this);
		}
	}

	exitRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.exitComparator(this);
		}
	}
}

CanopusDSLParser.ProgramContext = ProgramContext;
CanopusDSLParser.PatternDefContext = PatternDefContext;
CanopusDSLParser.PatternExprContext = PatternExprContext;
CanopusDSLParser.MiddleExprContext = MiddleExprContext;
CanopusDSLParser.MultipExprContext = MultipExprContext;
CanopusDSLParser.PrimaryContext = PrimaryContext;
CanopusDSLParser.MultipOperatorContext = MultipOperatorContext;
CanopusDSLParser.ExprContext = ExprContext;
CanopusDSLParser.ConditionContext = ConditionContext;
CanopusDSLParser.ComparatorContext = ComparatorContext;
