import type { PathsDisplayMode } from "@/configuration";

export type TransitionBucket = {
	sumScore: number;
	numScores: number;
	count: number;
};

export type AggregatedLinksMap = Record<
	string,
	Record<string, Record<string, TransitionBucket>>
>;

export type RawLinkCountsMap = Record<
	string,
	Record<string, Record<string, number>>
>;

export type SankeyAggregationConfig = {
	maxDepth: number;
	scoreEvolutionFilter: number;
	useScoreEvolutionFilter: boolean;
	pathsDisplayMode: PathsDisplayMode;
	reachableFromStart: Set<string>;
	reachableFromStartStrict: Set<string>;
	canReachEnd: Set<string>;
	canReachEndStrict: Set<string>;
	avgNodeScore: Record<string, number>;
};
