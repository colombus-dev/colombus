import type * as monaco_editor from "monaco-editor";
import { useEffect, useState } from "react";
import { EDITOR_LANGUAGE_ID } from "@/lib/constants";
import type { MonacoEditor } from "@/lib/types";

const canopusTheme: monaco_editor.editor.IStandaloneThemeData = {
	base: "vs",
	inherit: true,
	rules: [
		{ token: "comment", foreground: "6b6b6b", fontStyle: "italic" }, // gray
		{ token: "string", foreground: "7f6000" }, // brown-gold
		{ token: "keyword", foreground: "005aa7", fontStyle: "bold" }, // deep blue
		{ token: "connector", foreground: "000000", fontStyle: "bold" }, // black
		{ token: "key", foreground: "000000" }, // black
	],
	colors: {
		"editor.background": "#ffffff",
		"editor.foreground": "#202124",
		"editorCursor.foreground": "#000000",
		"editorLineNumber.foreground": "#777777",
		"editorLineNumber.activeForeground": "#000000",
		"editor.selectionBackground": "#dce3f0", // pale blue highlight
		"editor.inactiveSelectionBackground": "#f0f2f5",
		editorLineHighlightBackground: "#f9f9f9",
		"scrollbarSlider.background": "#cccccc88",
		"scrollbarSlider.hoverBackground": "#bbbbbb88",
		"scrollbarSlider.activeBackground": "#aaaaaa88",
	},
};

export default function useCanopusTheme(monaco: MonacoEditor | null) {
	const [themeName, setThemeName] = useState<string>();
	useEffect(() => {
		if (!monaco) {
			return;
		}
		monaco.editor.defineTheme(`${EDITOR_LANGUAGE_ID}Theme`, canopusTheme);
		setThemeName(`${EDITOR_LANGUAGE_ID}Theme`);
	}, [monaco]);

	return { themeName };
}
