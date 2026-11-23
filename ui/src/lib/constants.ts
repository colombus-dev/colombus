export const EDITOR_LANGUAGE_ID = "Canopus";
export const DEFAULT_DSL_CODE = "";

export const ALGO_NODE_ATTRIBUTE_KEYS = ["algoFamily", "algoName"];
export const LIBRARY_NODE_ATTRIBUTE_KEYS = ["library", "function"];

export const PATTERN_META_INSTRUCTION_KEYS = [
	"algoFamily",
	"algoName",
	"library",
	"function",
	"action",
	"metrics",
];
export const PATTERN_KEYS = ["step", ...PATTERN_META_INSTRUCTION_KEYS];

export const PATH = {
	INDEX: "/",
	HOME: "/home",
	EXPLORER: "/explorer",
} as const;
