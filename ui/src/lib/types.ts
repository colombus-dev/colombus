import { z } from "zod";

const basePatternGroup = z.object({
	name: z.string(),
	steps: z.string().array().default([]),
	multiplicity: z.enum(["*", "+", "1"]).default("1"),
	metaCharacters: z
		.object({
			startsWith: z.boolean().default(false),
			endsWith: z.boolean().default(false),
			negate: z.boolean().default(false),
		})
		.default({}),
});

const basePattern = z.object({
	name: z.string().optional(),
});

export type PatternGroup = {
	name: string;
	steps?: string[];
	multiplicity?: "*" | "+" | "1";
	metaCharacters?: {
		startsWith?: boolean;
		endsWith?: boolean;
		negate?: boolean;
	};
	subpattern?: Pattern | null;
};

export type Pattern = {
	name?: string;
	groups?: PatternGroup[];
};

export const Pattern: z.ZodType<Pattern> = basePattern
	.extend({
		groups: z.lazy(() => PatternGroup.array().optional()),
	})
	.strict();

export const PatternGroup: z.ZodType<PatternGroup> = basePatternGroup
	.extend({
		subpattern: z.lazy(() =>
			Pattern.nullable()
				.transform((x) => x ?? undefined)
				.optional(),
		),
	})
	.strict();
