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
import { DEFAULT_DSL_CODE, EDITOR_LANGUAGE_ID } from "@/lib/constants";
import type { MonacoEditor } from "@/lib/types";
import { useColombusStore } from "@/store";

interface PatternDslEditorProps {
	onSubmitted?: (content: string) => void;
	content?: string;
	onContentChange?: (content: string) => void;
}

export default function PatternDslEditor({
	onSubmitted,
	content,
	onContentChange,
	...props
}: PatternDslEditorProps &
	React.HTMLAttributes<HTMLDivElement> &
	React.RefAttributes<HTMLDivElement>) {
	const monaco = useMonaco();
	const editorRef = useRef<monaco_editor.editor.IStandaloneCodeEditor>(null);

	const currentPatternContent = useColombusStore(
		(state) => state.currentPattern?.dsl_content,
	);
	const editorContent = content ?? currentPatternContent ?? DEFAULT_DSL_CODE;

	const { validateGrammarModel } = useCanopusGrammar(monaco);
	const { themeName } = useCanopusTheme(monaco);
	useCanopusCompletion(monaco);
	useCompletionActions(monaco, onSubmitted);

	useEffect(() => {
		return () => {
			editorRef.current?.dispose();
		};
	}, []);

	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) {
			return;
		}

		if (editor.getValue() !== editorContent) {
			editor.setValue(editorContent);
		}
	}, [editorContent]);

	const onModelContentChange = useCallback(
		(newContent: string | undefined) => {
			if (newContent) {
				onContentChange?.(newContent);
			}
			const model = editorRef.current?.getModel();
			if (model && newContent) {
				validateGrammarModel(model);
			}
		},
		[onContentChange, validateGrammarModel],
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
		<div {...props} className={props.className}>
			<Editor
				theme={themeName}
				defaultLanguage={EDITOR_LANGUAGE_ID}
				defaultValue={editorContent}
				onChange={onModelContentChange}
				onMount={handleEditorDidMount}
				options={{
					minimap: { enabled: false },
					fontSize: 14,
					wordWrap: "on",
					automaticLayout: true,
				}}
			/>
		</div>
	);
}
