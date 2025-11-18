import type * as monaco_editor from "monaco-editor";
import { useEffect } from "react";
import { supportedSteps } from "@/configuration";
import { EDITOR_LANGUAGE_ID } from "@/lib/constants";
import type { MonacoEditor } from "@/lib/types";

const keyCompletions: { [key: string]: () => string[] } = {
	step: () => supportedSteps,
};

// TODO: check replace instead of insert for completion

export default function useCanopusCompletion(monaco: MonacoEditor | null) {
	useEffect(() => {
		if (!monaco) {
			return;
		}
		// register new pattern creation completion
		monaco.languages.registerCompletionItemProvider(EDITOR_LANGUAGE_ID, {
			provideCompletionItems(
				_model,
				position,
				_context,
				_token,
			): monaco_editor.languages.CompletionList {
				const suggestions: monaco_editor.languages.CompletionItem[] = [
					{
						label: "pattern",
						kind: monaco.languages.CompletionItemKind.Keyword,
						insertText: 'pattern ${1:Name} = [${2:key}="${3:value}"]',
						insertTextRules:
							monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						documentation: "Define a new pattern.",
						range: {
							startLineNumber: position.lineNumber,
							endLineNumber: position.lineNumber,
							// TODO: check startColumn and endColumn
							startColumn: 0,
							endColumn: position.column,
						},
					},
				];
				return { suggestions };
			},
		});
		// register keys completion
		monaco.languages.registerCompletionItemProvider(EDITOR_LANGUAGE_ID, {
			triggerCharacters: ["[", ","],
			provideCompletionItems(
				model,
				position,
			): monaco_editor.languages.CompletionList {
				const textUntilPosition = model
					.getValueInRange({
						startLineNumber: position.lineNumber,
						startColumn: 1,
						endLineNumber: position.lineNumber,
						endColumn: position.column,
					})
					.trim();

				// Only trigger suggestions when typing a key
				const isInsideBracket = /\[/.test(textUntilPosition);
				const isInsideString = /"/.test(textUntilPosition);

				if (!isInsideBracket || isInsideString) return { suggestions: [] };

				const suggestions: monaco_editor.languages.CompletionItem[] = [
					"step",
					"algoName",
					"algoFamily",
				].map((key) => ({
					label: key,
					kind: monaco.languages.CompletionItemKind.Property,
					insertText: key,
					detail: "Available key",
					documentation: `Insert the key "${key}"`,
					range: {
						startLineNumber: position.lineNumber,
						endLineNumber: position.lineNumber,
						startColumn: position.column,
						endColumn: position.column,
					},
				}));

				return { suggestions };
			},
		});
		// register values completion
		monaco.languages.registerCompletionItemProvider(EDITOR_LANGUAGE_ID, {
			triggerCharacters: ['"'],
			provideCompletionItems(
				model,
				position,
			): monaco_editor.languages.CompletionList {
				const textUntilPosition = model
					.getValueInRange({
						startLineNumber: position.lineNumber,
						startColumn: 1,
						endLineNumber: position.lineNumber,
						endColumn: position.column,
					})
					.trim();
				// Only trigger suggestions when typing a value
				const isInsideBracket = /\[/.test(textUntilPosition);
				const isBracketClosed = /\]/.test(textUntilPosition);
				const isAfterStep = /=/.test(textUntilPosition);

				if (!(isInsideBracket && isAfterStep && !isBracketClosed)) {
					return { suggestions: [] };
				}

				const currentKeyValuePair = textUntilPosition.split(",").at(-1);
				const currentKey = currentKeyValuePair
					?.split("=")
					.at(-2)
					?.replace("[", "")
					.trim();

				if (!currentKey || !Object.keys(keyCompletions).includes(currentKey)) {
					return { suggestions: [] };
				}

				const suggestions: monaco_editor.languages.CompletionItem[] =
					keyCompletions[currentKey]().map((value) => ({
						label: value,
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: value,
						detail: "Available values",
						documentation: `Insert the value "${value}"`,
						range: {
							startLineNumber: position.lineNumber,
							endLineNumber: position.lineNumber,
							startColumn: position.column,
							endColumn: position.column,
						},
					}));

				return { suggestions };
			},
		});
	}, [monaco]);
}
