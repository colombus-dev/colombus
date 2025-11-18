import { KeyCode, KeyMod } from "monaco-editor";
import { useEffect } from "react";
import type { MonacoEditor } from "@/lib/types";

export default function useCompletionActions(
	monaco: MonacoEditor | null,
	onSubmitted?: (newContent: string) => void,
) {
	useEffect(() => {
		if (!monaco) {
			return;
		}
		monaco.editor.addEditorAction({
			// (temporary) execute action
			id: "run-code",
			label: "Run Code",
			contextMenuOrder: 2,
			contextMenuGroupId: "1_modification",
			keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
			run: (_editor) => onSubmitted?.(_editor.getValue()),
		});
	}, [monaco, onSubmitted]);
}
