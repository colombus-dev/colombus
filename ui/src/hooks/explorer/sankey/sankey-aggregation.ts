import type { GraphDefinition, StepNode } from "@/api/client";
import type { PpmResult } from "@/lib/types";
import { checkConditionBase } from "./sankey-reachability";
import { unrollSteps } from "./sankey-topology";
import type {
	AggregatedLinksMap,
	SankeyAggregationConfig,
} from "./sankey-types";

function findMinMaxMatchedIndices(
	results: string[][],
	stepIdMap: Map<string, number>,
) {
	let globalMin = Number.MAX_SAFE_INTEGER;
	let globalMax = -1;

	for (const groupMatches of results) {
		for (const stepId of groupMatches) {
			const idx = stepIdMap.get(stepId);
			if (idx !== undefined) {
				if (idx < globalMin) globalMin = idx;
				if (idx > globalMax) globalMax = idx;
			}
		}
	}
	return { globalMin, globalMax };
}

function extractMatchedRanges(
	profilePpm: PpmResult | undefined,
	steps: StepNode[],
) {
	const matchedRanges: { min: number; max: number }[] = [];
	if (!profilePpm?.results) return matchedRanges;

	const stepIdMap = new Map(steps.map((s, idx) => [s.id, idx]));
	let { globalMin, globalMax } = findMinMaxMatchedIndices(
		profilePpm.results,
		stepIdMap,
	);

	if (globalMin !== Number.MAX_SAFE_INTEGER) {
		if (globalMin === globalMax) globalMax = globalMin + 1;
		matchedRanges.push({ min: globalMin, max: globalMax });
	}
	return matchedRanges;
}

function determineBucketKey(
	src: string,
	tgt: string,
	i: number,
	matchedRanges: { min: number; max: number }[],
	isPatternActive: boolean,
	conf: SankeyAggregationConfig,
): { key: string; count: number } {
	if (src.startsWith("_PADDING_") || tgt.startsWith("_PADDING_")) {
		return { key: "transparent", count: 1e-6 };
	}

	const cond = checkConditionBase(
		src,
		tgt,
		conf.useScoreEvolutionFilter,
		conf.scoreEvolutionFilter,
		conf.avgNodeScore,
	);
	const isReachStart =
		conf.reachableFromStart.has(src) || conf.reachableFromStartStrict.has(src);
	const isReachEnd =
		conf.canReachEnd.has(tgt) || conf.canReachEndStrict.has(tgt);

	let validPath = cond.ok && isReachStart && isReachEnd;
	if (
		validPath &&
		conf.useScoreEvolutionFilter &&
		(conf.scoreEvolutionFilter === 1 || conf.scoreEvolutionFilter === 3)
	) {
		validPath =
			conf.reachableFromStartStrict.has(src) ||
			cond.strict ||
			conf.canReachEndStrict.has(tgt);
	}

	if (!validPath) return { key: "hidden", count: 0 };

	let isMatched = false;
	for (const range of matchedRanges) {
		if (i >= range.min && i < range.max) {
			isMatched = true;
			break;
		}
	}

	if (isPatternActive && conf.pathsDisplayMode === "show-matching") {
		return { key: isMatched ? "colored_0.75" : "grey", count: 1 };
	}
	return { key: "colored_0.6", count: 1 };
}

function processSingleProfileLink(
	i: number,
	unrolledIds: string[],
	matchedRanges: { min: number; max: number }[],
	isPatternActive: boolean,
	score: number | null | undefined,
	conf: SankeyAggregationConfig,
	aggregatedLinks: AggregatedLinksMap,
) {
	const sourceId = unrolledIds[i];
	const targetId = unrolledIds[i + 1];
	if (sourceId === targetId) return;

	const { key: bucketKey, count: countToAdd } = determineBucketKey(
		sourceId,
		targetId,
		i,
		matchedRanges,
		isPatternActive,
		conf,
	);

	if (!aggregatedLinks[sourceId]) aggregatedLinks[sourceId] = {};
	if (!aggregatedLinks[sourceId][targetId])
		aggregatedLinks[sourceId][targetId] = {};
	if (!aggregatedLinks[sourceId][targetId][bucketKey]) {
		aggregatedLinks[sourceId][targetId][bucketKey] = {
			sumScore: 0,
			numScores: 0,
			count: 0,
		};
	}

	const bucket = aggregatedLinks[sourceId][targetId][bucketKey];
	bucket.count += countToAdd;
	if (score !== undefined && score !== null && bucketKey !== "transparent") {
		bucket.sumScore += score;
		bucket.numScores += 1;
	}
}

function processProfileLinks(
	profile: GraphDefinition,
	score: number | null | undefined,
	profilePpm: PpmResult | undefined,
	conf: SankeyAggregationConfig,
	aggregatedLinks: AggregatedLinksMap,
	nodePositions: Record<string, number[]>,
	nodeLabelMap: Record<string, string>,
) {
	const steps = [...profile.steps].sort((a, b) => a.position - b.position);
	const unrolledIds = unrollSteps(steps, conf.maxDepth);

	for (let i = 0; i < conf.maxDepth; i++) {
		const stepName = unrolledIds[i];
		if (!nodePositions[stepName]) nodePositions[stepName] = [];
		nodePositions[stepName].push(i);
		nodeLabelMap[stepName] = stepName;
	}

	const matchedRanges = extractMatchedRanges(profilePpm, steps);
	const isPatternActive = !!profilePpm?.results;

	for (let i = 0; i < conf.maxDepth - 1; i++) {
		processSingleProfileLink(
			i,
			unrolledIds,
			matchedRanges,
			isPatternActive,
			score,
			conf,
			aggregatedLinks,
		);
	}
}

export function aggregateLinkWeights(
	nodes: GraphDefinition[],
	filteredProfilesNames: string[],
	availableProfilesWithPpmData: PpmResult[],
	profilesScores: Record<string, number | null | undefined>,
	conf: SankeyAggregationConfig,
) {
	const aggregatedLinks: AggregatedLinksMap = {};
	const nodePositions: Record<string, number[]> = {};
	const nodeLabelMap: Record<string, string> = {};

	for (const profile of nodes) {
		if (!filteredProfilesNames.includes(profile.name)) continue;
		const profilePpm = availableProfilesWithPpmData.find(
			(p) => p.profile_name === profile.name,
		);
		const score = profilesScores?.[profile.name];
		processProfileLinks(
			profile,
			score,
			profilePpm,
			conf,
			aggregatedLinks,
			nodePositions,
			nodeLabelMap,
		);
	}
	return { aggregatedLinks, nodePositions, nodeLabelMap };
}
