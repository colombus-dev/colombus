export type PatternElementType = "simple" | "subpattern";
export type PatternElement = {
	name: string;
	tasks: PatternElement[];
	type: PatternElementType;
};
