import type { OnMount } from "@monaco-editor/react";
import Editor, { useMonaco } from "@monaco-editor/react";
import _ from "lodash";
import type * as monaco_editor from "monaco-editor";
import { useCallback, useEffect, useRef, useState } from "react";
import ProfilePatternActions from "@/components/profile-pattern-actions";
import useCanopusCompletion from "@/hooks/editor/useCanopusCompletion";
import useCanopusGrammar from "@/hooks/editor/useCanopusGrammar";
import useCompletionActions from "@/hooks/editor/useCompletionActions";
import useEditorErrorHandling from "@/hooks/editor/useEditorErrorHandling";
import { DEFAULT_DSL_CODE, EDITOR_LANGUAGE_ID } from "@/lib/constants";
import type { MonacoEditor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";

interface PatternDslEditorProps {
	onSubmitted?: (content: string) => void;
	onSave?: (content: string) => void;
	isExecuting?: boolean;
	backendError?: string | null;
}

export default function PatternDslEditor({
	onSubmitted,
	onSave,
	isExecuting,
	backendError,
	...props
}: PatternDslEditorProps &
	React.HTMLAttributes<HTMLDivElement> &
	React.RefAttributes<HTMLDivElement>) {
	const monaco = useMonaco();
	const editorRef = useRef<monaco_editor.editor.IStandaloneCodeEditor>(null);

	const currentPatternContent = useColombusStore(
		(state) => state.currentPattern?.dsl_content,
	);

	const { handleBeforeEditorMount, validateGrammarModel } =
		useCanopusGrammar(monaco);
	useCanopusCompletion(monaco);
	useCompletionActions(monaco, onSubmitted);

	const { validateBeforeSubmit } = useEditorErrorHandling({
		monaco,
		editorRef,
		backendError,
	});

	const [isDirty, setIsDirty] = useState(false);

	useEffect(() => {
		return () => {
			editorRef.current?.dispose();
		};
	}, []);

	useEffect(() => {
		editorRef.current?.setValue(currentPatternContent ?? DEFAULT_DSL_CODE);
		setIsDirty(false);
	}, [currentPatternContent]);

	const onModelContentChange = useCallback(
		(newContent: string | undefined) => {
			setIsDirty(newContent !== (currentPatternContent ?? DEFAULT_DSL_CODE));
			const model = editorRef.current?.getModel();
			if (model && newContent !== undefined) {
				validateGrammarModel(model);
				if (backendError) {
					monaco?.editor.setModelMarkers(model, "backend", []);
				}
			}
		},
		[validateGrammarModel, backendError, monaco, currentPatternContent],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: validateGrammarModel is used inside _.debounce, which biome cannot statically analyse
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
		[validateGrammarModel],
	);

	return (
		<div
			{...props}
			className={cn("flex flex-col space-y-4 h-full", props.className)}
		>
			<ProfilePatternActions
				className="mb-4"
				isExecuting={isExecuting}
				isDirty={isDirty}
				onExecute={() => {
					const content =
						editorRef.current?.getValue() ??
						currentPatternContent ??
						DEFAULT_DSL_CODE;
					if (content && validateBeforeSubmit()) {
						onSubmitted?.(content);
					}
				}}
				onSave={() => {
					const content =
						editorRef.current?.getValue() ??
						currentPatternContent ??
						DEFAULT_DSL_CODE;
					if (content && validateBeforeSubmit()) {
						onSave?.(content);
					}
				}}
			/>
			<Editor
				className="border rounded-2xl overflow-hidden"
				theme="light-plus" // dark-plus
				language={EDITOR_LANGUAGE_ID}
				defaultValue={currentPatternContent ?? DEFAULT_DSL_CODE}
				onChange={onModelContentChange}
				onMount={handleEditorDidMount}
				beforeMount={handleBeforeEditorMount}
				options={{
					minimap: { enabled: false },
					fontSize: 14,
					wordWrap: "on",
					automaticLayout: true,
					wordBasedSuggestions: "off",
					scrollBeyondLastLine: false,
				}}
			/>
		</div>
	);
}
