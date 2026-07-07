import type * as monaco_editor from "monaco-editor";
import { useCallback, useEffect, useRef, useState } from "react";

export default function useEditorResizer(
	initialHeight: number,
	editorRef: React.RefObject<monaco_editor.editor.IStandaloneCodeEditor | null>,
) {
	const [editorHeight, setEditorHeight] = useState(initialHeight);
	const isDraggingRef = useRef(false);
	const startYRef = useRef(0);
	const startHeightRef = useRef(0);

	const onMouseDown = useCallback(
		(e: React.MouseEvent) => {
			isDraggingRef.current = true;
			startYRef.current = e.clientY;
			startHeightRef.current = editorHeight;
			document.body.style.cursor = "row-resize";
			document.body.style.userSelect = "none";
		},
		[editorHeight],
	);

	useEffect(() => {
		const onMouseMove = (e: MouseEvent) => {
			if (!isDraggingRef.current) return;
			const delta = e.clientY - startYRef.current;
			setEditorHeight(Math.max(100, startHeightRef.current + delta));
		};
		const onMouseUp = () => {
			if (isDraggingRef.current) {
				isDraggingRef.current = false;
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
				editorRef.current?.layout();
			}
		};
		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
		return () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
		};
	}, [editorRef]);

	return { editorHeight, onMouseDown };
}
