import type { GraphDefinition } from "@/api/client";
import type { PpmResult } from "@/lib/types";
import { checkConditionBase } from "./sankey-reachability";
import { unrollSteps } from "./sankey-topology";
import type {
	AggregatedLinksMap,
	SankeyAggregationConfig,
} from "./sankey-types";

function extractMatchedRanges(
	profilePpm: PpmResult | undefined,
	steps: { id: string }[],
) {
	const matchedRanges: { min: number; max: number }[] = [];
	if (!profilePpm?.results) return matchedRanges;

	const stepIdMap = new Map(steps.map((s, idx) => [s.id, idx]));

	let globalMin = Number.MAX_SAFE_INTEGER;
	let globalMax = -1;

	for (const groupMatches of profilePpm.results) {
		for (const stepId of groupMatches) {
			const idx = stepIdMap.get(stepId);
			if (idx !== undefined) {
				if (idx < globalMin) globalMin = idx;
				if (idx > globalMax) globalMax = idx;
			}
		}
	}

	if (globalMin !== Number.MAX_SAFE_INTEGER) {
		// If globalMin === globalMax, it means a single node matched.
		// We extend globalMax by 1 so the outgoing edge is colored.
		if (globalMin === globalMax) globalMax = globalMin + 1;
		matchedRanges.push({ min: globalMin, max: globalMax });
	}

	return matchedRanges;
}

function determineBucketKey(
	src: string,
	tgt: string,
	isMatched: boolean,
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

	// isMatched is already provided

	if (conf.pathsDisplayMode === "show-matching") {
		return { key: isMatched ? "colored_0.75" : "grey", count: 1 };
	}
	return { key: "colored_0.6", count: 1 };
}

function processProfileLinks(
	profile: GraphDefinition,
	score: number | null | undefined,
	profilePpm: PpmResult | undefined,
	conf: SankeyAggregationConfig,
	aggregatedLinks: AggregatedLinksMap,
	nodePositions: Record<string, number[]>,
	nodeLabelMap: Record<string, string>,
	matchedNodes: Set<string>,
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

	if (isPatternActive && profilePpm?.results) {
		const stepIdMap = new Map(steps.map((s, idx) => [s.id, idx]));
		for (const groupMatches of profilePpm.results) {
			for (const stepId of groupMatches) {
				const idx = stepIdMap.get(stepId);
				if (idx !== undefined) {
					matchedNodes.add(unrolledIds[idx]);
				}
			}
		}
	}

	for (let i = 0; i < conf.maxDepth - 1; i++) {
		const sourceId = unrolledIds[i];
		const targetId = unrolledIds[i + 1];
		if (sourceId === targetId) continue;

		let isMatched = false;
		if (isPatternActive) {
			for (const range of matchedRanges) {
				if (i >= range.min && i < range.max) {
					isMatched = true;
					break;
				}
			}
		}

		const { key: bucketKey, count: countToAdd } = determineBucketKey(
			sourceId,
			targetId,
			isMatched,
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
	const matchedNodes = new Set<string>();

	for (const profile of nodes) {
		if (!filteredProfilesNames.includes(profile.name)) continue;
		const profilePpms = availableProfilesWithPpmData.filter(
			(p) => p.profile_name === profile.name,
		);
		let profilePpm: PpmResult | undefined;
		if (profilePpms.length > 0) {
			profilePpm = {
				profile_name: profile.name,
				results: profilePpms.flatMap((p) => p.results),
			};
		}
		const score = profilesScores?.[profile.name];
		processProfileLinks(
			profile,
			score,
			profilePpm,
			conf,
			aggregatedLinks,
			nodePositions,
			nodeLabelMap,
			matchedNodes,
		);
	}
	return { aggregatedLinks, nodePositions, nodeLabelMap, matchedNodes };
}
