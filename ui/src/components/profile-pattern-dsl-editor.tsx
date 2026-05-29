import type { OnMount } from "@monaco-editor/react";
import Editor, { useMonaco } from "@monaco-editor/react";
import _ from "lodash";
import type * as monaco_editor from "monaco-editor";
import { useCallback, useEffect, useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import ProfilePatternActions from "@/components/profile-pattern-actions";
import useCanopusCompletion from "@/hooks/editor/useCanopusCompletion";
import useCanopusGrammar from "@/hooks/editor/useCanopusGrammar";
import useCanopusTheme from "@/hooks/editor/useCanopusTheme";
import useCompletionActions from "@/hooks/editor/useCompletionActions";
import { DEFAULT_DSL_CODE, EDITOR_LANGUAGE_ID } from "@/lib/constants";
import type { MonacoEditor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";

interface PatternDslEditorProps {
	onSubmitted?: (content: string) => void;
	isExecuting?: boolean;
}

export default function PatternDslEditor({ onSubmitted, isExecuting, ...props }: PatternDslEditorProps & React.HTMLAttributes<HTMLDivElement>) {
	const monaco = useMonaco();
	const [editor, setEditor] = useState<monaco_editor.editor.IStandaloneCodeEditor | null>(null);

	const currentPatternContent = useColombusStore(
		(state) => state.currentPattern?.dsl_content,
	);

	const { validateGrammarModel } = useCanopusGrammar(monaco);
	const { themeName } = useCanopusTheme(monaco);
	useCanopusCompletion(monaco);
	useCompletionActions(monaco, onSubmitted);

	useEffect(() => {
		if (editor) {
			editor.setValue(currentPatternContent ?? DEFAULT_DSL_CODE);
		}
	}, [currentPatternContent, editor]);

	const onModelContentChange = useCallback(
		(newContent: string | undefined) => {
			const model = editor?.getModel();
			if (model && newContent) {
				validateGrammarModel(model);
			}
		},
		[validateGrammarModel, editor],
	);

	const handleEditorDidMount: OnMount = useCallback(
		_.debounce(
			(
				mountedEditor: monaco_editor.editor.IStandaloneCodeEditor,
				_monaco: MonacoEditor,
			) => {
				setEditor(mountedEditor);
				const model = mountedEditor.getModel();
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
				isExecuting={isExecuting}
				onExecute={() => {
					const content =
						editor?.getValue() ??
						currentPatternContent ??
						DEFAULT_DSL_CODE;
					if (content) {
						onSubmitted?.(content);
					}
				}}
			/>
			<div className="group relative h-48 w-full border border-slate-200 bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.04)] overflow-hidden">
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
		</div>
	);
}
