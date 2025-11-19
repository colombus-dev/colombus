import { CommonTokenStream, InputStream } from "antlr4";
import type * as monaco_editor from "monaco-editor";
import { MarkerSeverity } from "monaco-editor";
import { useCallback, useEffect } from "react";
import CanopusDSLLexer from "@/hooks/editor/CanopusDSLLexer.js";
import CanopusDSLParser from "@/hooks/editor/CanopusDSLParser.js";
import { EDITOR_LANGUAGE_ID } from "@/lib/constants";
import type { MonacoEditor } from "@/lib/types";

const canopusGrammarLanguage: monaco_editor.languages.IMonarchLanguage = {
	tokenizer: {
		root: [
			// Handle comments
			[/#.*/, "comment"],

			// Handle strings
			[/"[^"\n]*"/, "string"],

			// Handle keywords
			[/\b(pattern|start|end)\b/, "keyword"],

			// Handle operators
			[/->/, "connector"],
			[/\*|\+/, "operator"],

			// Handle delimiters
			[/\(|\)|\[|\]|,/, "delimiter"],

			// Handle delimiters
			[/[a-z][A-Za-z0-9_]*/, "key"],
		],
	},
};

export default function useCanopusGrammar(monaco: MonacoEditor | null) {
	useEffect(() => {
		if (!monaco) {
			return;
		}
		monaco.languages.register({ id: EDITOR_LANGUAGE_ID });

		monaco.languages.setMonarchTokensProvider(
			EDITOR_LANGUAGE_ID,
			canopusGrammarLanguage,
		);

		monaco.languages.setLanguageConfiguration(EDITOR_LANGUAGE_ID, {
			comments: {
				lineComment: "#",
			},
			brackets: [
				["[", "]"],
				["(", ")"],
			],
			autoClosingPairs: [
				{ open: "(", close: ")" },
				{ open: "[", close: "]" },
				{ open: '"', close: '"' },
			],
		});
	}, [monaco]);

	const validateGrammarModel = useCallback(
		(model: monaco_editor.editor.ITextModel) => {
			if (!monaco) {
				return;
			}
			const code = model.getValue();
			const markers: monaco_editor.editor.IMarkerData[] = [];

			try {
				const input = new InputStream(code);
				const lexer = new CanopusDSLLexer(input);
				const tokens = new CommonTokenStream(lexer);
				const parser = new CanopusDSLParser(tokens);

				parser.removeErrorListeners();
				parser.addErrorListener({
					syntaxError(_recognizer, _offendingSymbol, line, column, msg) {
						markers.push({
							severity: MarkerSeverity.Error,
							message: msg,
							startLineNumber: line,
							startColumn: column + 1,
							endLineNumber: line,
							endColumn: column + 2,
						});
					},
				});

				parser.program(); // Parse using the root rule
			} catch (e) {
				console.error("Parse error:", e);
			}

			// Apply markers to Monaco
			monaco.editor.setModelMarkers(model, "antlr", markers);
		},
		[monaco],
	);

	return { validateGrammarModel };
}
