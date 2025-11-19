// Generated from ./CanopusDSL.g4 by ANTLR 4.13.2
// jshint ignore: start
import antlr4 from "antlr4";
import CanopusDSLListener from "./CanopusDSLListener.js";

const serializedATN = [
	4, 1, 20, 119, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2,
	5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7, 10, 1, 0,
	5, 0, 24, 8, 0, 10, 0, 12, 0, 27, 9, 0, 1, 0, 4, 0, 30, 8, 0, 11, 0, 12, 0,
	31, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 40, 8, 1, 10, 1, 12, 1, 43, 9,
	1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1,
	3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 3, 3, 64, 8, 3, 1, 4, 1, 4, 1, 4, 5, 4,
	69, 8, 4, 10, 4, 12, 4, 72, 9, 4, 1, 5, 1, 5, 3, 5, 76, 8, 5, 1, 6, 1, 6, 1,
	6, 1, 6, 4, 6, 82, 8, 6, 11, 6, 12, 6, 83, 1, 6, 1, 6, 1, 6, 1, 6, 1, 6, 1, 6,
	5, 6, 92, 8, 6, 10, 6, 12, 6, 95, 9, 6, 1, 6, 1, 6, 1, 6, 1, 6, 3, 6, 101, 8,
	6, 1, 7, 1, 7, 1, 8, 1, 8, 1, 8, 5, 8, 108, 8, 8, 10, 8, 12, 8, 111, 9, 8, 1,
	9, 1, 9, 1, 9, 1, 9, 1, 10, 1, 10, 1, 10, 0, 0, 11, 0, 2, 4, 6, 8, 10, 12, 14,
	16, 18, 20, 0, 2, 2, 0, 11, 11, 19, 19, 2, 0, 4, 4, 12, 12, 121, 0, 25, 1, 0,
	0, 0, 2, 35, 1, 0, 0, 0, 4, 44, 1, 0, 0, 0, 6, 63, 1, 0, 0, 0, 8, 65, 1, 0, 0,
	0, 10, 73, 1, 0, 0, 0, 12, 100, 1, 0, 0, 0, 14, 102, 1, 0, 0, 0, 16, 104, 1,
	0, 0, 0, 18, 112, 1, 0, 0, 0, 20, 116, 1, 0, 0, 0, 22, 24, 3, 2, 1, 0, 23, 22,
	1, 0, 0, 0, 24, 27, 1, 0, 0, 0, 25, 23, 1, 0, 0, 0, 25, 26, 1, 0, 0, 0, 26,
	29, 1, 0, 0, 0, 27, 25, 1, 0, 0, 0, 28, 30, 3, 4, 2, 0, 29, 28, 1, 0, 0, 0,
	30, 31, 1, 0, 0, 0, 31, 29, 1, 0, 0, 0, 31, 32, 1, 0, 0, 0, 32, 33, 1, 0, 0,
	0, 33, 34, 5, 0, 0, 1, 34, 1, 1, 0, 0, 0, 35, 36, 5, 1, 0, 0, 36, 41, 5, 15,
	0, 0, 37, 38, 5, 2, 0, 0, 38, 40, 5, 15, 0, 0, 39, 37, 1, 0, 0, 0, 40, 43, 1,
	0, 0, 0, 41, 39, 1, 0, 0, 0, 41, 42, 1, 0, 0, 0, 42, 3, 1, 0, 0, 0, 43, 41, 1,
	0, 0, 0, 44, 45, 5, 3, 0, 0, 45, 46, 5, 15, 0, 0, 46, 47, 5, 4, 0, 0, 47, 48,
	3, 6, 3, 0, 48, 5, 1, 0, 0, 0, 49, 50, 5, 13, 0, 0, 50, 51, 5, 5, 0, 0, 51,
	52, 3, 8, 4, 0, 52, 53, 5, 5, 0, 0, 53, 54, 5, 14, 0, 0, 54, 64, 1, 0, 0, 0,
	55, 56, 5, 13, 0, 0, 56, 57, 5, 5, 0, 0, 57, 64, 3, 8, 4, 0, 58, 59, 3, 8, 4,
	0, 59, 60, 5, 5, 0, 0, 60, 61, 5, 14, 0, 0, 61, 64, 1, 0, 0, 0, 62, 64, 3, 8,
	4, 0, 63, 49, 1, 0, 0, 0, 63, 55, 1, 0, 0, 0, 63, 58, 1, 0, 0, 0, 63, 62, 1,
	0, 0, 0, 64, 7, 1, 0, 0, 0, 65, 70, 3, 10, 5, 0, 66, 67, 5, 5, 0, 0, 67, 69,
	3, 10, 5, 0, 68, 66, 1, 0, 0, 0, 69, 72, 1, 0, 0, 0, 70, 68, 1, 0, 0, 0, 70,
	71, 1, 0, 0, 0, 71, 9, 1, 0, 0, 0, 72, 70, 1, 0, 0, 0, 73, 75, 3, 12, 6, 0,
	74, 76, 3, 14, 7, 0, 75, 74, 1, 0, 0, 0, 75, 76, 1, 0, 0, 0, 76, 11, 1, 0, 0,
	0, 77, 78, 5, 6, 0, 0, 78, 81, 3, 16, 8, 0, 79, 80, 5, 7, 0, 0, 80, 82, 3, 16,
	8, 0, 81, 79, 1, 0, 0, 0, 82, 83, 1, 0, 0, 0, 83, 81, 1, 0, 0, 0, 83, 84, 1,
	0, 0, 0, 84, 85, 1, 0, 0, 0, 85, 86, 5, 8, 0, 0, 86, 101, 1, 0, 0, 0, 87, 88,
	5, 9, 0, 0, 88, 93, 3, 18, 9, 0, 89, 90, 5, 2, 0, 0, 90, 92, 3, 18, 9, 0, 91,
	89, 1, 0, 0, 0, 92, 95, 1, 0, 0, 0, 93, 91, 1, 0, 0, 0, 93, 94, 1, 0, 0, 0,
	94, 96, 1, 0, 0, 0, 95, 93, 1, 0, 0, 0, 96, 97, 5, 10, 0, 0, 97, 101, 1, 0, 0,
	0, 98, 101, 5, 15, 0, 0, 99, 101, 5, 19, 0, 0, 100, 77, 1, 0, 0, 0, 100, 87,
	1, 0, 0, 0, 100, 98, 1, 0, 0, 0, 100, 99, 1, 0, 0, 0, 101, 13, 1, 0, 0, 0,
	102, 103, 7, 0, 0, 0, 103, 15, 1, 0, 0, 0, 104, 109, 3, 12, 6, 0, 105, 106, 5,
	5, 0, 0, 106, 108, 3, 12, 6, 0, 107, 105, 1, 0, 0, 0, 108, 111, 1, 0, 0, 0,
	109, 107, 1, 0, 0, 0, 109, 110, 1, 0, 0, 0, 110, 17, 1, 0, 0, 0, 111, 109, 1,
	0, 0, 0, 112, 113, 5, 16, 0, 0, 113, 114, 3, 20, 10, 0, 114, 115, 5, 17, 0, 0,
	115, 19, 1, 0, 0, 0, 116, 117, 7, 1, 0, 0, 117, 21, 1, 0, 0, 0, 10, 25, 31,
	41, 63, 70, 75, 83, 93, 100, 109,
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
		"'import'",
		"','",
		"'pattern'",
		"'='",
		"'->'",
		"'('",
		"'|'",
		"')'",
		"'['",
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
		"importPatterns",
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
			this.state = 25;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === 1) {
				this.state = 22;
				this.importPatterns();
				this.state = 27;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 29;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				this.state = 28;
				this.patternDef();
				this.state = 31;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while (_la === 3);
			this.state = 33;
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

	importPatterns() {
		const localctx = new ImportPatternsContext(this, this._ctx, this.state);
		this.enterRule(localctx, 2, CanopusDSLParser.RULE_importPatterns);
		var _la = 0;
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 35;
			this.match(CanopusDSLParser.T__0);
			this.state = 36;
			this.match(CanopusDSLParser.ID);
			this.state = 41;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === 2) {
				this.state = 37;
				this.match(CanopusDSLParser.T__1);
				this.state = 38;
				this.match(CanopusDSLParser.ID);
				this.state = 43;
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

	patternDef() {
		const localctx = new PatternDefContext(this, this._ctx, this.state);
		this.enterRule(localctx, 4, CanopusDSLParser.RULE_patternDef);
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 44;
			this.match(CanopusDSLParser.T__2);
			this.state = 45;
			this.match(CanopusDSLParser.ID);
			this.state = 46;
			this.match(CanopusDSLParser.T__3);
			this.state = 47;
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
		this.enterRule(localctx, 6, CanopusDSLParser.RULE_patternExpr);
		try {
			this.state = 63;
			this._errHandler.sync(this);
			// biome-ignore lint/correctness/noInnerDeclarations: autogenerated by ANTLR4
			var la_ = this._interp.adaptivePredict(this._input, 3, this._ctx);
			switch (la_) {
				case 1:
					this.enterOuterAlt(localctx, 1);
					this.state = 49;
					this.match(CanopusDSLParser.START_OP);
					this.state = 50;
					this.match(CanopusDSLParser.T__4);
					this.state = 51;
					this.middleExpr();
					this.state = 52;
					this.match(CanopusDSLParser.T__4);
					this.state = 53;
					this.match(CanopusDSLParser.END_OP);
					break;

				case 2:
					this.enterOuterAlt(localctx, 2);
					this.state = 55;
					this.match(CanopusDSLParser.START_OP);
					this.state = 56;
					this.match(CanopusDSLParser.T__4);
					this.state = 57;
					this.middleExpr();
					break;

				case 3:
					this.enterOuterAlt(localctx, 3);
					this.state = 58;
					this.middleExpr();
					this.state = 59;
					this.match(CanopusDSLParser.T__4);
					this.state = 60;
					this.match(CanopusDSLParser.END_OP);
					break;

				case 4:
					this.enterOuterAlt(localctx, 4);
					this.state = 62;
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
		this.enterRule(localctx, 8, CanopusDSLParser.RULE_middleExpr);
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 65;
			this.multipExpr();
			this.state = 70;
			this._errHandler.sync(this);
			// biome-ignore lint/correctness/noInnerDeclarations: autogenerated by ANTLR4
			var _alt = this._interp.adaptivePredict(this._input, 4, this._ctx);
			// biome-ignore lint/suspicious/noDoubleEquals: autogenerated by ANTLR4
			while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					this.state = 66;
					this.match(CanopusDSLParser.T__4);
					this.state = 67;
					this.multipExpr();
				}
				this.state = 72;
				this._errHandler.sync(this);
				_alt = this._interp.adaptivePredict(this._input, 4, this._ctx);
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
		this.enterRule(localctx, 10, CanopusDSLParser.RULE_multipExpr);
		var _la = 0;
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 73;
			this.primary();
			this.state = 75;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === 11 || _la === 19) {
				this.state = 74;
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
		this.enterRule(localctx, 12, CanopusDSLParser.RULE_primary);
		var _la = 0;
		try {
			this.state = 100;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
				case 6:
					localctx = new AlternativeExprContext(this, localctx);
					this.enterOuterAlt(localctx, 1);
					this.state = 77;
					this.match(CanopusDSLParser.T__5);
					this.state = 78;
					this.expr();
					this.state = 81;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					do {
						this.state = 79;
						this.match(CanopusDSLParser.T__6);
						this.state = 80;
						this.expr();
						this.state = 83;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
					} while (_la === 7);
					this.state = 85;
					this.match(CanopusDSLParser.T__7);
					break;
				case 9:
					localctx = new ElementExprContext(this, localctx);
					this.enterOuterAlt(localctx, 2);
					this.state = 87;
					this.match(CanopusDSLParser.T__8);
					this.state = 88;
					this.condition();
					this.state = 93;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					while (_la === 2) {
						this.state = 89;
						this.match(CanopusDSLParser.T__1);
						this.state = 90;
						this.condition();
						this.state = 95;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
					}
					this.state = 96;
					this.match(CanopusDSLParser.T__9);
					break;
				case 15:
					localctx = new IdContext(this, localctx);
					this.enterOuterAlt(localctx, 3);
					this.state = 98;
					this.match(CanopusDSLParser.ID);
					break;
				case 19:
					localctx = new WildcardContext(this, localctx);
					this.enterOuterAlt(localctx, 4);
					this.state = 99;
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
		this.enterRule(localctx, 14, CanopusDSLParser.RULE_multipOperator);
		var _la = 0;
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 102;
			_la = this._input.LA(1);
			if (!(_la === 11 || _la === 19)) {
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
		this.enterRule(localctx, 16, CanopusDSLParser.RULE_expr);
		var _la = 0;
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 104;
			this.primary();
			this.state = 109;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === 5) {
				this.state = 105;
				this.match(CanopusDSLParser.T__4);
				this.state = 106;
				this.primary();
				this.state = 111;
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
		this.enterRule(localctx, 18, CanopusDSLParser.RULE_condition);
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 112;
			this.match(CanopusDSLParser.LABEL);
			this.state = 113;
			this.comparator();
			this.state = 114;
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
		this.enterRule(localctx, 20, CanopusDSLParser.RULE_comparator);
		var _la = 0;
		try {
			this.enterOuterAlt(localctx, 1);
			this.state = 116;
			_la = this._input.LA(1);
			if (!(_la === 4 || _la === 12)) {
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
CanopusDSLParser.T__11 = 12;
CanopusDSLParser.START_OP = 13;
CanopusDSLParser.END_OP = 14;
CanopusDSLParser.ID = 15;
CanopusDSLParser.LABEL = 16;
CanopusDSLParser.STRING = 17;
CanopusDSLParser.WS = 18;
CanopusDSLParser.WILDCARD = 19;
CanopusDSLParser.COMMENT = 20;

CanopusDSLParser.RULE_program = 0;
CanopusDSLParser.RULE_importPatterns = 1;
CanopusDSLParser.RULE_patternDef = 2;
CanopusDSLParser.RULE_patternExpr = 3;
CanopusDSLParser.RULE_middleExpr = 4;
CanopusDSLParser.RULE_multipExpr = 5;
CanopusDSLParser.RULE_primary = 6;
CanopusDSLParser.RULE_multipOperator = 7;
CanopusDSLParser.RULE_expr = 8;
CanopusDSLParser.RULE_condition = 9;
CanopusDSLParser.RULE_comparator = 10;

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

	importPatterns = function (i) {
		if (i === undefined) {
			i = null;
		}
		if (i === null) {
			return this.getTypedRuleContexts(ImportPatternsContext);
		} else {
			return this.getTypedRuleContext(ImportPatternsContext, i);
		}
	};

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

class ImportPatternsContext extends antlr4.ParserRuleContext {
	constructor(parser, parent, invokingState) {
		if (parent === undefined) {
			parent = null;
		}
		if (invokingState === undefined || invokingState === null) {
			invokingState = -1;
		}
		super(parent, invokingState);
		this.parser = parser;
		this.ruleIndex = CanopusDSLParser.RULE_importPatterns;
	}

	ID = function (i) {
		if (i === undefined) {
			i = null;
		}
		if (i === null) {
			return this.getTokens(CanopusDSLParser.ID);
		} else {
			return this.getToken(CanopusDSLParser.ID, i);
		}
	};

	enterRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.enterImportPatterns(this);
		}
	}

	exitRule(listener) {
		if (listener instanceof CanopusDSLListener) {
			listener.exitImportPatterns(this);
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
CanopusDSLParser.ImportPatternsContext = ImportPatternsContext;
CanopusDSLParser.PatternDefContext = PatternDefContext;
CanopusDSLParser.PatternExprContext = PatternExprContext;
CanopusDSLParser.MiddleExprContext = MiddleExprContext;
CanopusDSLParser.MultipExprContext = MultipExprContext;
CanopusDSLParser.PrimaryContext = PrimaryContext;
CanopusDSLParser.MultipOperatorContext = MultipOperatorContext;
CanopusDSLParser.ExprContext = ExprContext;
CanopusDSLParser.ConditionContext = ConditionContext;
CanopusDSLParser.ComparatorContext = ComparatorContext;
