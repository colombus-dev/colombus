import type { OnMount } from "@monaco-editor/react";
import Editor, { useMonaco } from "@monaco-editor/react";
import _ from "lodash";
import type * as monaco_editor from "monaco-editor";
import { useCallback, useEffect, useRef } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import useCanopusCompletion from "@/hooks/editor/useCanopusCompletion";
import useCanopusGrammar from "@/hooks/editor/useCanopusGrammar";
import useCanopusTheme from "@/hooks/editor/useCanopusTheme";
import useCompletionActions from "@/hooks/editor/useCompletionActions";
import { EDITOR_LANGUAGE_ID } from "@/lib/constants";
import type { MonacoEditor } from "@/lib/types";

interface PatternDslEditorProps {
	value?: string;
	onValueChange?: (newContent: string) => void;
	onSubmitted?: (content: string) => void;
	height?: string;
}

export default function PatternDslEditor({
	value,
	onValueChange,
	onSubmitted,
	height = "100px",
}: PatternDslEditorProps) {
	const monaco = useMonaco();
	const editorRef = useRef<monaco_editor.editor.IStandaloneCodeEditor>(null);

	const { validateGrammarModel } = useCanopusGrammar(monaco);
	const { themeName } = useCanopusTheme(monaco);
	useCanopusCompletion(monaco);
	useCompletionActions(monaco, onSubmitted);

	useEffect(() => {
		return () => {
			editorRef.current?.dispose();
		};
	}, []);

	const onModelContentChange = useCallback(
		(newContent: string | undefined) => {
			const model = editorRef.current?.getModel();
			if (model && newContent) {
				validateGrammarModel(model);
			}
			onValueChange?.(newContent ?? "");
		},
		[validateGrammarModel, onValueChange],
	);

	const handleEditorDidMount: OnMount = useCallback(
		_.debounce(
			(
				editor: monaco_editor.editor.IStandaloneCodeEditor,
				_monaco: MonacoEditor,
			) => {
				editorRef.current = editor;
				const model = editor.getModel();
				if (model) {
					// TODO: to check
					validateGrammarModel(model);
				}
			},
			300,
		),
		[],
	);

	if (!themeName) {
		return <BounceLoader color="green" loading={true} />;
	}

	return (
		<Editor
			height={height}
			theme={themeName}
			defaultLanguage={EDITOR_LANGUAGE_ID}
			defaultValue={value}
			value={value}
			onChange={onModelContentChange}
			onMount={handleEditorDidMount}
			options={{
				minimap: { enabled: false },
				fontSize: 14,
				wordWrap: "on",
				automaticLayout: true,
			}}
		/>
	);
}
