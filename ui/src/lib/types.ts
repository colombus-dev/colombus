export type PatternElementType = "simple" | "special" | "subpattern";
export type PatternElement = {
	name: string;
	tasks: PatternElement[];
	type: PatternElementType;
};
