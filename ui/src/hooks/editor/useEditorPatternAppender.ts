import type * as monaco_editor from "monaco-editor";
import { useEffect } from "react";
import { useColombusStore } from "@/store";

function getNextPatternIndex(allSavedPatterns: { name?: string }[]): number {
	let maxPatternIndex = 0;
	for (const p of allSavedPatterns) {
		const match = p.name?.match(/^Pattern(\d+)$/i);
		if (match) {
			const num = Number.parseInt(match[1], 10);
			if (num > maxPatternIndex) maxPatternIndex = num;
		}
	}
	return maxPatternIndex + 1;
}

function calculateNewContent(
	currentVal: string,
	patternAppendTrigger: string,
	allSavedPatterns: { name?: string }[],
): string {
	const trimmed = currentVal.trim();
	const hasPatternDecl = /pattern\s+\w+\s*=/.test(currentVal);
	const isOnlyComments =
		trimmed === "" ||
		trimmed
			.split("\n")
			.every((l) => l.trim().startsWith("#") || l.trim() === "");

	if (!hasPatternDecl && isOnlyComments) {
		const suffix = currentVal.endsWith("\n") || currentVal === "" ? "" : "\n";
		const nextIndex = getNextPatternIndex(allSavedPatterns);
		return (
			currentVal +
			suffix +
			`pattern Pattern${nextIndex} = ${patternAppendTrigger}`
		);
	}

	if (trimmed.endsWith("]")) {
		return currentVal + " -> " + patternAppendTrigger;
	}

	return (
		currentVal + (currentVal.endsWith(" ") ? "" : " ") + patternAppendTrigger
	);
}

export default function useEditorPatternAppender({
	editorRef,
	setIsDirty,
}: {
	editorRef: React.RefObject<monaco_editor.editor.IStandaloneCodeEditor | null>;
	setIsDirty: (isDirty: boolean) => void;
}) {
	const patternAppendTrigger = useColombusStore(
		(state) => state.patternAppendTrigger,
	);
	const setPatternAppendTrigger = useColombusStore(
		(state) => state.setPatternAppendTrigger,
	);
	const allSavedPatterns = useColombusStore((state) => state.allSavedPatterns);

	useEffect(() => {
		if (patternAppendTrigger && editorRef.current) {
			const currentVal = editorRef.current.getValue();
			const newVal = calculateNewContent(
				currentVal,
				patternAppendTrigger,
				allSavedPatterns,
			);

			editorRef.current.setValue(newVal);
			setPatternAppendTrigger(undefined);
			setIsDirty(true);
		}
	}, [
		patternAppendTrigger,
		setPatternAppendTrigger,
		allSavedPatterns,
		editorRef,
		setIsDirty,
	]);
}
