import type * as monaco_editor from "monaco-editor";
import { useEffect } from "react";
import { supportedSteps } from "@/configuration";
import { EDITOR_LANGUAGE_ID } from "@/lib/constants";
import type { MonacoEditor } from "@/lib/types";
import { useColombusStore } from "@/store";

const keyCompletions: { [key: string]: () => string[] } = {
	step: () => supportedSteps,
};

// TODO: check replace instead of insert for completion

export default function useCanopusCompletion(monaco: MonacoEditor | null) {
	const allSavedPatterns = useColombusStore((state) => state.allSavedPatterns);

	useEffect(() => {
		if (!monaco) {
			return;
		}
		// register new pattern creation completion
		const patternCreationCompletionProvider =
			monaco.languages.registerCompletionItemProvider(EDITOR_LANGUAGE_ID, {
				provideCompletionItems(
					model,
					position,
					_context,
					_token,
				): monaco_editor.languages.CompletionList {
					const textUntilPosition = model.getValueInRange({
						startLineNumber: position.lineNumber,
						startColumn: 1,
						endLineNumber: position.lineNumber,
						endColumn: position.column,
					});
					const lastOpenBracket = textUntilPosition.lastIndexOf("[");
					const lastCloseBracket = textUntilPosition.lastIndexOf("]");
					const isInsideBracket = lastOpenBracket > lastCloseBracket;

					const quoteCount = (textUntilPosition.match(/"/g) || []).length;
					const isInsideString = quoteCount % 2 !== 0;

					if (isInsideBracket || isInsideString) return { suggestions: [] };

					const match = textUntilPosition.match(/([a-zA-Z0-9_]+)$/);
					const wordLength = match ? match[1].length : 0;
					const range = {
						startLineNumber: position.lineNumber,
						endLineNumber: position.lineNumber,
						startColumn: position.column - wordLength,
						endColumn: position.column,
					};
					const suggestions: monaco_editor.languages.CompletionItem[] = [
						{
							label: "pattern",
							kind: monaco.languages.CompletionItemKind.Keyword,
							// biome-ignore lint/suspicious/noTemplateCurlyInString: Monaco snippet placeholder syntax, not a JS template literal
							insertText: 'pattern ${1:Name} = [${2:key}="${3:value}"]',
							insertTextRules:
								monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
							documentation: "Define a new pattern.",
							range,
						},
						{
							label: "import",
							kind: monaco.languages.CompletionItemKind.Keyword,
							// biome-ignore lint/suspicious/noTemplateCurlyInString: Monaco snippet placeholder syntax, not a JS template literal
							insertText: "import ${1:Name}",
							insertTextRules:
								monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
							documentation: "Import a new pattern.",
							range,
						},
					];
					return { suggestions };
				},
			});
		// register import completion
		const importCompletionProvider =
			monaco.languages.registerCompletionItemProvider(EDITOR_LANGUAGE_ID, {
				triggerCharacters: [" "],
				provideCompletionItems(
					model,
					position,
				): monaco_editor.languages.CompletionList {
					const textUntilPosition = model.getValueInRange({
						startLineNumber: position.lineNumber,
						startColumn: 1,
						endLineNumber: position.lineNumber,
						endColumn: position.column,
					});

					// Only trigger suggestions when typing a key
					const isAfterImport = /import/.test(textUntilPosition);

					if (!isAfterImport) return { suggestions: [] };

					const match = textUntilPosition.match(/([a-zA-Z0-9_]+)$/);
					const wordLength = match ? match[1].length : 0;
					const range = {
						startLineNumber: position.lineNumber,
						endLineNumber: position.lineNumber,
						startColumn: position.column - wordLength,
						endColumn: position.column,
					};

					const suggestions: monaco_editor.languages.CompletionItem[] =
						allSavedPatterns
							.map((pattern) => pattern.name)
							.filter((name) => name !== undefined)
							.map((name) => ({
								label: name,
								kind: monaco.languages.CompletionItemKind.Property,
								insertText: name,
								detail: "Available patterns to import",
								documentation: `Insert the pattern "${name}"`,
								range,
							}));

					return { suggestions };
				},
			});
		// register keys completion
		const keysCompletionProvider =
			monaco.languages.registerCompletionItemProvider(EDITOR_LANGUAGE_ID, {
				triggerCharacters: ["[", ","],
				provideCompletionItems(
					model,
					position,
				): monaco_editor.languages.CompletionList {
					const textUntilPosition = model.getValueInRange({
						startLineNumber: position.lineNumber,
						startColumn: 1,
						endLineNumber: position.lineNumber,
						endColumn: position.column,
					});

					// Only trigger suggestions when typing a key
					const lastOpenBracket = textUntilPosition.lastIndexOf("[");
					const lastCloseBracket = textUntilPosition.lastIndexOf("]");
					const isInsideBracket = lastOpenBracket > lastCloseBracket;

					const quoteCount = (textUntilPosition.match(/"/g) || []).length;
					const isInsideString = quoteCount % 2 !== 0;

					if (!isInsideBracket || isInsideString) return { suggestions: [] };

					const match = textUntilPosition.match(/([a-zA-Z0-9_]+)$/);
					const wordLength = match ? match[1].length : 0;
					const range = {
						startLineNumber: position.lineNumber,
						endLineNumber: position.lineNumber,
						startColumn: position.column - wordLength,
						endColumn: position.column,
					};

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
						range,
					}));

					return { suggestions };
				},
			});
		// register values completion
		const valuesCompletionProvider =
			monaco.languages.registerCompletionItemProvider(EDITOR_LANGUAGE_ID, {
				triggerCharacters: ['"'],
				provideCompletionItems(
					model,
					position,
				): monaco_editor.languages.CompletionList {
					const textUntilPosition = model.getValueInRange({
						startLineNumber: position.lineNumber,
						startColumn: 1,
						endLineNumber: position.lineNumber,
						endColumn: position.column,
					});
					// Only trigger suggestions when typing a value
					const lastOpenBracket = textUntilPosition.lastIndexOf("[");
					const lastCloseBracket = textUntilPosition.lastIndexOf("]");
					const isInsideBracket = lastOpenBracket > lastCloseBracket;

					if (!isInsideBracket) {
						return { suggestions: [] };
					}

					const currentBlockText = textUntilPosition.slice(lastOpenBracket);
					const isAfterStep = /=/.test(currentBlockText);

					if (!isAfterStep) {
						return { suggestions: [] };
					}

					const currentKeyValuePair = currentBlockText.trim().split(",").at(-1);
					const currentKey = currentKeyValuePair
						?.split("=")
						.at(-2)
						?.replace("[", "")
						.trim();

					if (
						!currentKey ||
						!Object.keys(keyCompletions).includes(currentKey)
					) {
						return { suggestions: [] };
					}

					// Match everything after the last unclosed quote
					const match = textUntilPosition.match(/"([^"]*)$/);
					const wordLength = match ? match[1].length : 0;
					const range = {
						startLineNumber: position.lineNumber,
						endLineNumber: position.lineNumber,
						startColumn: position.column - wordLength,
						endColumn: position.column,
					};

					const suggestions: monaco_editor.languages.CompletionItem[] =
						keyCompletions[currentKey]().map((value) => ({
							label: value,
							kind: monaco.languages.CompletionItemKind.Property,
							insertText: value,
							detail: "Available values",
							documentation: `Insert the value "${value}"`,
							range,
						}));

					return { suggestions };
				},
			});

		return () => {
			patternCreationCompletionProvider.dispose();
			importCompletionProvider.dispose();
			keysCompletionProvider.dispose();
			valuesCompletionProvider.dispose();
		};
	}, [monaco, allSavedPatterns]);
}
