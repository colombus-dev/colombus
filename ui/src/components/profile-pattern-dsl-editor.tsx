import type { OnMount } from "@monaco-editor/react";
import Editor, { useMonaco } from "@monaco-editor/react";
import _ from "lodash";
import type * as monaco_editor from "monaco-editor";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import useCanopusCompletion from "@/hooks/editor/useCanopusCompletion";
import useCanopusGrammar from "@/hooks/editor/useCanopusGrammar";
import useCanopusTheme from "@/hooks/editor/useCanopusTheme";
import useCompletionActions from "@/hooks/editor/useCompletionActions";
import { DEFAULT_DSL_CODE, EDITOR_LANGUAGE_ID } from "@/lib/constants";
import type { MonacoEditor } from "@/lib/types";
import { useColombusStore } from "@/store";

export interface PatternDslEditorHandle {
	getContent: () => string | undefined;
}

interface PatternDslEditorProps {
	onSubmitted?: (content: string) => void;
}

const PatternDslEditor = forwardRef<
	PatternDslEditorHandle,
	PatternDslEditorProps & React.HTMLAttributes<HTMLDivElement>
>(({ onSubmitted, ...props }, ref) => {
	const monaco = useMonaco();
	const editorRef = useRef<monaco_editor.editor.IStandaloneCodeEditor>(null);

	useImperativeHandle(ref, () => ({
		getContent: () => editorRef.current?.getValue(),
	}));

	const currentPatternContent = useColombusStore(
		(state) => state.currentPattern?.dsl_content,
	);

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
		editorRef.current?.setValue(currentPatternContent ?? DEFAULT_DSL_CODE);
	}, [currentPatternContent]);

	const onModelContentChange = useCallback(
		(newContent: string | undefined) => {
			const model = editorRef.current?.getModel();
			if (model && newContent) {
				validateGrammarModel(model);
			}
		},
		[validateGrammarModel],
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
				defaultValue={currentPatternContent ?? DEFAULT_DSL_CODE}
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
});

PatternDslEditor.displayName = "PatternDslEditor";

export default PatternDslEditor;
