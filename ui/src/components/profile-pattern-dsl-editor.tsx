import type { OnMount } from "@monaco-editor/react";
import Editor, { useMonaco } from "@monaco-editor/react";
import _ from "lodash";
import type * as monaco_editor from "monaco-editor";
import { useCallback, useEffect, useRef, useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import ProfilePatternActions from "@/components/profile-pattern-actions";
import useCanopusCompletion from "@/hooks/editor/useCanopusCompletion";
import useCanopusGrammar from "@/hooks/editor/useCanopusGrammar";
import useCanopusTheme from "@/hooks/editor/useCanopusTheme";
import useCompletionActions from "@/hooks/editor/useCompletionActions";
import useEditorErrorHandling from "@/hooks/editor/useEditorErrorHandling";
import useEditorResizer from "@/hooks/editor/useEditorResizer";
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

	const { validateGrammarModel } = useCanopusGrammar(monaco);
	const { themeName } = useCanopusTheme(monaco);
	useCanopusCompletion(monaco);
	useCompletionActions(monaco, onSubmitted);

	const { validateBeforeSubmit } = useEditorErrorHandling({
		monaco,
		editorRef,
		backendError,
	});

	const { editorHeight, onMouseDown } = useEditorResizer(192, editorRef);

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
			if (model && newContent) {
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

	if (!themeName) {
		return <BounceLoader color="green" loading={true} />;
	}

	return (
		<div {...props} className={cn("flex flex-col space-y-4", props.className)}>
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
			<div
				className="group relative w-full border border-slate-200 bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.04)] overflow-hidden"
				style={{ height: editorHeight }}
			>
				<div className="absolute inset-0 pb-3">
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
							wordBasedSuggestions: "off",
							scrollBeyondLastLine: false,
						}}
					/>
				</div>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: this is a resizer handle */}
				<div
					className="absolute bottom-0 left-0 right-0 h-3 cursor-row-resize flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors z-10 border-t border-slate-100"
					onMouseDown={onMouseDown}
				>
					<div className="flex gap-1">
						<div className="w-1 h-1 rounded-full bg-slate-300" />
						<div className="w-1 h-1 rounded-full bg-slate-300" />
						<div className="w-1 h-1 rounded-full bg-slate-300" />
					</div>
				</div>
			</div>
		</div>
	);
}
