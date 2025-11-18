import type * as monaco_editor from "monaco-editor";
import { z } from "zod";

export const PatternGroupMetaInstruction = z.object({
	algoFamily: z
		.string()
		.nullable()
		.transform((x) => x ?? undefined)
		.optional(),
	algoName: z
		.string()
		.nullable()
		.transform((x) => x ?? undefined)
		.optional(),
	library: z
		.string()
		.nullable()
		.transform((x) => x ?? undefined)
		.optional(),
	function: z
		.string()
		.nullable()
		.transform((x) => x ?? undefined)
		.optional(),
});

// we need to explicitly define the type (instead of zod.infer) because of
// nullable which is causing type errors in PatternGroup
export type PatternGroupMetaInstruction = {
	algoFamily?: string | null;
	algoName?: string | null;
	library?: string | null;
	function?: string | null;
};

const basePatternGroup = z.object({
	name: z.string(),
	steps: z.string().array().default([]),
	metaInstructions: PatternGroupMetaInstruction.array()
		.nullable()
		.transform((x) => x ?? undefined)
		.optional(),
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
	dsl_content: z.string().optional(),
});

export type PatternGroup = {
	name: string;
	steps?: string[];
	metaInstructions?: PatternGroupMetaInstruction[] | null;
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
	dsl_content?: string;
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

export const PpmResult = z.object({
	profile_name: z.string(),
	results: z.string().array().array(),
});

export type PpmResult = z.infer<typeof PpmResult>;

export const DiffResult = PpmResult.extend({ ratio: z.number() });

export type DiffResult = z.infer<typeof DiffResult>;

// Monaco editor (for DSL)
export type MonacoEditor = typeof monaco_editor;
