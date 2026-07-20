import type * as monaco_editor from "monaco-editor";
import { useEffect } from "react";
import type { MonacoEditor } from "@/lib/types";

interface UseEditorErrorHandlingProps {
	monaco: MonacoEditor | null;
	editorRef: React.RefObject<monaco_editor.editor.IStandaloneCodeEditor | null>;
	backendError?: string | null;
}

export default function useEditorErrorHandling({
	monaco,
	editorRef,
	backendError,
}: UseEditorErrorHandlingProps) {
	useEffect(() => {
		if (backendError && editorRef.current && monaco) {
			const model = editorRef.current.getModel();
			if (model) {
				let startLine = 1;
				while (
					startLine <= model.getLineCount() &&
					model.getLineContent(startLine).trim().startsWith("#")
				) {
					startLine++;
				}
				if (startLine > model.getLineCount()) {
					startLine = model.getLineCount();
				}
				const marker: monaco_editor.editor.IMarkerData = {
					severity: monaco.MarkerSeverity.Error,
					message: backendError,
					startLineNumber: startLine,
					startColumn: 1,
					endLineNumber: model.getLineCount(),
					endColumn: model.getLineMaxColumn(model.getLineCount()),
				};
				monaco.editor.setModelMarkers(model, "backend", [marker]);
				editorRef.current.trigger("keyboard", "editor.action.marker.next", {});
			}
		} else if (!backendError && editorRef.current && monaco) {
			const model = editorRef.current.getModel();
			if (model) {
				monaco.editor.setModelMarkers(model, "backend", []);
			}
		}
	}, [backendError, monaco, editorRef]);

	const validateBeforeSubmit = (): boolean => {
		if (editorRef.current && monaco) {
			const model = editorRef.current.getModel();
			if (model) {
				const markers = monaco.editor.getModelMarkers({
					owner: "antlr",
				});
				if (markers.length > 0) {
					editorRef.current.trigger(
						"keyboard",
						"editor.action.marker.next",
						{},
					);
					return false;
				}
			}
		}
		return true;
	};

	return { validateBeforeSubmit };
}
