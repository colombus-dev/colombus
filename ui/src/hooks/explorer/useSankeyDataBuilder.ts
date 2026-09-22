import { useMemo } from "react";
import type { GraphDefinition, StepNode } from "@/api/client";
import type { PathsDisplayMode } from "@/configuration";
import { stepsColorsMapping } from "@/configuration";
import type { PpmResult } from "@/lib/types";
import { hexToRgba, scoreToContinuousColor } from "@/lib/utils";

type SankeyDataBuilderProps = {
	nodes: GraphDefinition[] | undefined;
	filteredProfilesNames: string[];
	availableProfilesWithPpmData: PpmResult[];
	profilesScores: Record<string, number | null | undefined>;
	pathsDisplayMode: PathsDisplayMode;
	scoreEvolutionFilter: number;
	useScoreEvolutionFilter: boolean;
};

// --- CORE TYPES ---
type TransitionBucket = {
	sumScore: number;
	numScores: number;
	count: number;
};
type AggregatedLinksMap = Record<
	string,
	Record<string, Record<string, TransitionBucket>>
>;
type RawLinkCountsMap = Record<string, Record<string, Record<string, number>>>;

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

// --- UTILS ---

function calculateMaxDepth(
	nodes: GraphDefinition[],
	filteredProfilesNames: string[],
): number {
	let maxDepth = 0;
	for (const profile of nodes) {
		if (!filteredProfilesNames.includes(profile.name)) continue;
		if (profile.steps.length > maxDepth) maxDepth = profile.steps.length;
	}
	return maxDepth;
}

function unrollSteps(steps: StepNode[], maxDepth: number): string[] {
	const unrolledIds: string[] = [];
	for (let i = 0; i < maxDepth; i++) {
		if (i < steps.length) {
			const stepName = steps[i].name.replace(/ \(\d+\)$/, "").trim();
			unrolledIds.push(`${stepName} (${i + 1})`);
		} else {
			unrolledIds.push(`_PADDING_${i + 1}`);
		}
	}
	return unrolledIds;
}

// --- TOPOLOGY ---

function processProfileTopology(
	profile: GraphDefinition,
	score: number,
	maxDepth: number,
	nodeScoresAcc: Record<string, number[]>,
	existingLinks: Record<string, Set<string>>,
) {
	const steps = [...profile.steps].sort((a, b) => a.position - b.position);
	const unrolledIds = unrollSteps(steps, maxDepth);

	for (const stepName of unrolledIds) {
		if (!nodeScoresAcc[stepName]) nodeScoresAcc[stepName] = [];
		nodeScoresAcc[stepName].push(score);
	}

	for (let i = 0; i < unrolledIds.length - 1; i++) {
		const src = unrolledIds[i];
		const tgt = unrolledIds[i + 1];
		if (!existingLinks[src]) existingLinks[src] = new Set();
		existingLinks[src].add(tgt);
	}
}

function buildGraphTopology(
	nodes: GraphDefinition[],
	filteredProfilesNames: string[],
	profilesScores: Record<string, number | null | undefined>,
	maxDepth: number,
) {
	const nodeScoresAcc: Record<string, number[]> = {};
	const existingLinks: Record<string, Set<string>> = {};

	for (const profile of nodes) {
		if (!filteredProfilesNames.includes(profile.name)) continue;
		const score = profilesScores?.[profile.name];
		if (score === undefined || score === null) continue;
		processProfileTopology(
			profile,
			score,
			maxDepth,
			nodeScoresAcc,
			existingLinks,
		);
	}

	const avgNodeScore: Record<string, number> = {};
	for (const [nodeId, scores] of Object.entries(nodeScoresAcc)) {
		avgNodeScore[nodeId] = scores.reduce((a, b) => a + b, 0) / scores.length;
	}

	return { nodeScoresAcc, existingLinks, avgNodeScore };
}

// --- CONDITIONS ---

function checkConditionBase(
	src: string,
	tgt: string,
	useScoreEvolutionFilter: boolean,
	scoreEvolutionFilter: number,
	avgNodeScore: Record<string, number>,
) {
	if (!useScoreEvolutionFilter) return { ok: true, strict: false };
	if (src.startsWith("_PADDING_") || tgt.startsWith("_PADDING_"))
		return { ok: true, strict: false };

	const srcScore = avgNodeScore[src];
	const tgtScore = avgNodeScore[tgt];
	if (srcScore === undefined || tgtScore === undefined)
		return { ok: false, strict: false };

	const delta = tgtScore - srcScore;
	let ok = false;
	let strict = false;

	if (scoreEvolutionFilter === 1) {
		ok = delta <= 0;
		strict = delta < 0;
	} else if (scoreEvolutionFilter === 2) {
		ok = delta === 0;
	} else if (scoreEvolutionFilter === 3) {
		ok = delta >= 0;
		strict = delta > 0;
	} else {
		ok = true;
	}

	return { ok, strict };
}

// --- REACHABILITY ---

function buildNodesByDepth(
	nodeScoresAcc: Record<string, number[]>,
	maxDepth: number,
) {
	const nodesByDepth: string[][] = Array.from({ length: maxDepth }, () => []);
	const regex = /\((\d+)\)$/;
	for (const nodeId of Object.keys(nodeScoresAcc)) {
		let d = 0;
		if (nodeId.startsWith("_PADDING_")) {
			d = Number.parseInt(nodeId.split("_")[2], 10) - 1;
		} else {
			const match = regex.exec(nodeId);
			if (match) d = Number.parseInt(match[1], 10) - 1;
		}
		if (d >= 0 && d < maxDepth) nodesByDepth[d].push(nodeId);
	}
	return nodesByDepth;
}

function processForwardTargets(
	src: string,
	targets: Set<string>,
	reach: Set<string>,
	reachStrict: Set<string>,
	useFilter: boolean,
	scoreFilter: number,
	avgNodeScore: Record<string, number>,
) {
	for (const tgt of targets) {
		const cond = checkConditionBase(
			src,
			tgt,
			useFilter,
			scoreFilter,
			avgNodeScore,
		);
		if (cond.ok) {
			if (reachStrict.has(src) || cond.strict) reachStrict.add(tgt);
			else reach.add(tgt);
		}
	}
}

function processForwardReachability(
	nodesByDepth: string[][],
	existingLinks: Record<string, Set<string>>,
	avgNodeScore: Record<string, number>,
	maxDepth: number,
	scoreFilter: number,
	useFilter: boolean,
) {
	const reach = new Set<string>();
	const reachStrict = new Set<string>();
	for (const nodeId of nodesByDepth[0]) reach.add(nodeId);

	for (let d = 0; d < maxDepth - 1; d++) {
		for (const src of nodesByDepth[d]) {
			if (!reach.has(src) && !reachStrict.has(src)) continue;
			const targets = existingLinks[src] || new Set();
			processForwardTargets(
				src,
				targets,
				reach,
				reachStrict,
				useFilter,
				scoreFilter,
				avgNodeScore,
			);
		}
	}
	return { reach, reachStrict };
}

function processBackwardTargets(
	src: string,
	targets: Set<string>,
	canReach: Set<string>,
	canReachStrict: Set<string>,
	useFilter: boolean,
	scoreFilter: number,
	avgNodeScore: Record<string, number>,
) {
	for (const tgt of targets) {
		const cond = checkConditionBase(
			src,
			tgt,
			useFilter,
			scoreFilter,
			avgNodeScore,
		);
		if (cond.ok) {
			if (canReach.has(tgt) || canReachStrict.has(tgt)) {
				if (canReachStrict.has(tgt) || cond.strict) canReachStrict.add(src);
				else canReach.add(src);
			}
		}
	}
}

function processBackwardReachability(
	nodesByDepth: string[][],
	existingLinks: Record<string, Set<string>>,
	avgNodeScore: Record<string, number>,
	maxDepth: number,
	scoreFilter: number,
	useFilter: boolean,
) {
	const canReach = new Set<string>();
	const canReachStrict = new Set<string>();
	if (maxDepth === 0) return { canReach, canReachStrict };

	for (const nodeId of nodesByDepth[maxDepth - 1]) canReach.add(nodeId);
	for (let d = maxDepth - 2; d >= 0; d--) {
		for (const src of nodesByDepth[d]) {
			const targets = existingLinks[src] || new Set();
			processBackwardTargets(
				src,
				targets,
				canReach,
				canReachStrict,
				useFilter,
				scoreFilter,
				avgNodeScore,
			);
		}
	}
	return { canReach, canReachStrict };
}

function computeReachability(
	nodeScoresAcc: Record<string, number[]>,
	existingLinks: Record<string, Set<string>>,
	avgNodeScore: Record<string, number>,
	maxDepth: number,
	scoreEvolutionFilter: number,
	useScoreEvolutionFilter: boolean,
) {
	const nodesByDepth = buildNodesByDepth(nodeScoresAcc, maxDepth);
	const forward = processForwardReachability(
		nodesByDepth,
		existingLinks,
		avgNodeScore,
		maxDepth,
		scoreEvolutionFilter,
		useScoreEvolutionFilter,
	);
	const backward = processBackwardReachability(
		nodesByDepth,
		existingLinks,
		avgNodeScore,
		maxDepth,
		scoreEvolutionFilter,
		useScoreEvolutionFilter,
	);
	return {
		reachableFromStart: forward.reach,
		reachableFromStartStrict: forward.reachStrict,
		canReachEnd: backward.canReach,
		canReachEndStrict: backward.canReachStrict,
	};
}

// --- LINK WEIGHTS ---

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

	if (!validPath) return { key: "grey", count: 1 };

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

function aggregateLinkWeights(
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

// --- CYCLE REMOVAL ---

function getAvgPositions(nodePositions: Record<string, number[]>) {
	const avgPosition: Record<string, number> = {};
	for (const node in nodePositions) {
		const posArray = nodePositions[node];
		avgPosition[node] =
			posArray.reduce((sum, val) => sum + val, 0) / posArray.length;
	}
	return avgPosition;
}

function processAggregatedLinkBuckets(
	sourceId: string,
	targetId: string,
	buckets: Record<string, TransitionBucket>,
	rawLinkCounts: RawLinkCountsMap,
) {
	for (const bucketKey in buckets) {
		const bucket = buckets[bucketKey];
		let linkColor = "";

		if (bucketKey === "transparent") {
			linkColor = "rgba(0,0,0,0)";
		} else if (bucketKey === "grey") {
			linkColor = "rgba(100, 100, 100, 0.15)";
		} else {
			const avgScore =
				bucket.numScores > 0 ? bucket.sumScore / bucket.numScores : 0;
			const colorHex = scoreToContinuousColor(avgScore);
			const alphaStr = bucketKey.split("_")[1];
			linkColor = hexToRgba(colorHex, Number.parseFloat(alphaStr));
		}
		if (!rawLinkCounts[sourceId][targetId][linkColor]) {
			rawLinkCounts[sourceId][targetId][linkColor] = 0;
		}
		rawLinkCounts[sourceId][targetId][linkColor] += bucket.count;
	}
}

function processAggregatedColors(aggregatedLinks: AggregatedLinksMap) {
	const rawLinkCounts: RawLinkCountsMap = {};
	for (const sourceId in aggregatedLinks) {
		rawLinkCounts[sourceId] = {};
		for (const targetId in aggregatedLinks[sourceId]) {
			rawLinkCounts[sourceId][targetId] = {};
			const buckets = aggregatedLinks[sourceId][targetId];
			processAggregatedLinkBuckets(sourceId, targetId, buckets, rawLinkCounts);
		}
	}
	return rawLinkCounts;
}

class CycleRemover {
	private readonly visited = new Set<string>();
	private readonly recursionStack = new Set<string>();
	public readonly linkCounts: RawLinkCountsMap = {};

	constructor(
		private readonly rawLinkCounts: RawLinkCountsMap,
		private readonly avgPosition: Record<string, number>,
	) {}

	dfs(node: string) {
		this.visited.add(node);
		this.recursionStack.add(node);

		if (this.rawLinkCounts[node]) {
			const neighbors = Object.keys(this.rawLinkCounts[node]).sort((a, b) => {
				if (this.avgPosition[a] !== this.avgPosition[b])
					return this.avgPosition[a] - this.avgPosition[b];
				return a.localeCompare(b);
			});

			for (const neighbor of neighbors) {
				if (!this.visited.has(neighbor)) {
					if (!this.linkCounts[node]) this.linkCounts[node] = {};
					this.linkCounts[node][neighbor] = this.rawLinkCounts[node][neighbor];
					this.dfs(neighbor);
				} else if (!this.recursionStack.has(neighbor)) {
					if (!this.linkCounts[node]) this.linkCounts[node] = {};
					this.linkCounts[node][neighbor] = this.rawLinkCounts[node][neighbor];
				}
			}
		}
		this.recursionStack.delete(node);
	}
}

function removeCyclesFromGraph(
	aggregatedLinks: AggregatedLinksMap,
	nodePositions: Record<string, number[]>,
	nodeLabelMap: Record<string, string>,
) {
	const rawLinkCounts = processAggregatedColors(aggregatedLinks);
	const avgPosition = getAvgPositions(nodePositions);

	const sortedNodes = Object.keys(nodeLabelMap).sort((a, b) => {
		if (avgPosition[a] !== avgPosition[b])
			return avgPosition[a] - avgPosition[b];
		return a.localeCompare(b);
	});

	const remover = new CycleRemover(rawLinkCounts, avgPosition);
	for (const node of sortedNodes) {
		if (!remover.linkCounts[node]) {
			remover.dfs(node);
		}
	}

	return { linkCounts: remover.linkCounts, rawLinkCounts, avgPosition };
}

// --- FORMATTING ---

function calculateNodeFlows(rawLinkCounts: RawLinkCountsMap) {
	const nodeIncoming = new Map<string, number>();
	const nodeOutgoing = new Map<string, number>();

	for (const sourceId in rawLinkCounts) {
		for (const targetId in rawLinkCounts[sourceId]) {
			const colorsDict = rawLinkCounts[sourceId][targetId];
			let val = 0;
			for (const color in colorsDict) val += colorsDict[color];
			nodeOutgoing.set(sourceId, (nodeOutgoing.get(sourceId) || 0) + val);
			nodeIncoming.set(targetId, (nodeIncoming.get(targetId) || 0) + val);
		}
	}
	return { nodeIncoming, nodeOutgoing };
}

function processLinkColors(
	colorsDict: Record<string, number>,
	sIdx: number,
	tIdx: number,
	sources: number[],
	targets: number[],
	values: number[],
	colors: string[],
) {
	for (const linkColor in colorsDict) {
		const count = colorsDict[linkColor];
		if (count > 0) {
			sources.push(sIdx);
			targets.push(tIdx);
			values.push(count);
			colors.push(linkColor);
		}
	}
}

function mapLinksToArrays(
	linkCounts: RawLinkCountsMap,
	nodeIndices: Map<string, number>,
) {
	const sources: number[] = [];
	const targets: number[] = [];
	const values: number[] = [];
	const colors: string[] = [];

	for (const sourceId in linkCounts) {
		for (const targetId in linkCounts[sourceId]) {
			const colorsDict = linkCounts[sourceId][targetId];
			const sIdx = nodeIndices.get(sourceId);
			const tIdx = nodeIndices.get(targetId);

			if (sIdx !== undefined && tIdx !== undefined) {
				processLinkColors(
					colorsDict,
					sIdx,
					tIdx,
					sources,
					targets,
					values,
					colors,
				);
			}
		}
	}
	return { sources, targets, values, colors };
}

function getSortedNodes(
	nodeLabelMap: Record<string, string>,
	avgPosition: Record<string, number>,
	nodeIncoming: Map<string, number>,
	nodeOutgoing: Map<string, number>,
) {
	return Object.keys(nodeLabelMap).sort((a, b) => {
		if (avgPosition[a] !== avgPosition[b])
			return avgPosition[a] - avgPosition[b];
		const flowA = (nodeIncoming.get(a) || 0) + (nodeOutgoing.get(a) || 0);
		const flowB = (nodeIncoming.get(b) || 0) + (nodeOutgoing.get(b) || 0);
		if (flowA !== flowB) return flowB - flowA;
		return a.localeCompare(b);
	});
}

function computeNodeProperties(
	uniqueNodes: string[],
	nodeLabelMap: Record<string, string>,
	nodeIncoming: Map<string, number>,
	nodeOutgoing: Map<string, number>,
) {
	const realNodeLabels = uniqueNodes.map((id) => nodeLabelMap[id]);
	const nodeLabels = uniqueNodes.map(() => "");

	const nodeColors = realNodeLabels.map((label) => {
		if (label.startsWith("_PADDING_")) return "rgba(0,0,0,0)";
		const baseLabel = label.replace(/ \(\d+\)$/, "");
		return stepsColorsMapping[baseLabel] || "rgba(128, 128, 128, 0.7)";
	});

	const nodeCustomData = uniqueNodes.map((id, index) => {
		if (id.startsWith("_PADDING_")) return "";
		const label = realNodeLabels[index];
		const cleanName = label.replace(/ \(\d+\)$/, "");
		const totalFlow = Math.max(
			nodeIncoming.get(id) || 0,
			nodeOutgoing.get(id) || 0,
		);
		return `${cleanName}<br /><span style="font-size:10px;color:#888">Occurrences: ${totalFlow}</span>`;
	});

	return { nodeLabels, nodeColors, nodeCustomData };
}

function formatSankeyData(
	linkCounts: RawLinkCountsMap,
	rawLinkCounts: RawLinkCountsMap,
	nodeLabelMap: Record<string, string>,
	avgPosition: Record<string, number>,
	maxDepth: number,
) {
	const { nodeIncoming, nodeOutgoing } = calculateNodeFlows(rawLinkCounts);

	const uniqueNodes = getSortedNodes(
		nodeLabelMap,
		avgPosition,
		nodeIncoming,
		nodeOutgoing,
	);

	const nodeIndices = new Map<string, number>();
	uniqueNodes.forEach((nodeId, index) => {
		nodeIndices.set(nodeId, index);
	});

	const { nodeLabels, nodeColors, nodeCustomData } = computeNodeProperties(
		uniqueNodes,
		nodeLabelMap,
		nodeIncoming,
		nodeOutgoing,
	);

	const arrays = mapLinksToArrays(linkCounts, nodeIndices);

	return {
		nodeLabels,
		nodeColors,
		nodeCustomData,
		sources: arrays.sources,
		targets: arrays.targets,
		values: arrays.values,
		colors: arrays.colors,
		maxDepth,
		uniqueNodesCount: uniqueNodes.length,
	};
}

// --- EXPORT HOOK ---

export function useSankeyDataBuilder({
	nodes,
	filteredProfilesNames,
	availableProfilesWithPpmData,
	profilesScores,
	pathsDisplayMode,
	scoreEvolutionFilter,
	useScoreEvolutionFilter,
}: SankeyDataBuilderProps) {
	return useMemo(() => {
		if (!nodes || nodes.length === 0) return null;

		const maxDepth = calculateMaxDepth(nodes, filteredProfilesNames);
		const { nodeScoresAcc, existingLinks, avgNodeScore } = buildGraphTopology(
			nodes,
			filteredProfilesNames,
			profilesScores,
			maxDepth,
		);

		const reachability = computeReachability(
			nodeScoresAcc,
			existingLinks,
			avgNodeScore,
			maxDepth,
			scoreEvolutionFilter,
			useScoreEvolutionFilter,
		);

		const config: SankeyAggregationConfig = {
			maxDepth,
			scoreEvolutionFilter,
			useScoreEvolutionFilter,
			pathsDisplayMode,
			reachableFromStart: reachability.reachableFromStart,
			reachableFromStartStrict: reachability.reachableFromStartStrict,
			canReachEnd: reachability.canReachEnd,
			canReachEndStrict: reachability.canReachEndStrict,
			avgNodeScore,
		};

		const { aggregatedLinks, nodePositions, nodeLabelMap } =
			aggregateLinkWeights(
				nodes,
				filteredProfilesNames,
				availableProfilesWithPpmData,
				profilesScores,
				config,
			);

		const { linkCounts, rawLinkCounts, avgPosition } = removeCyclesFromGraph(
			aggregatedLinks,
			nodePositions,
			nodeLabelMap,
		);

		return formatSankeyData(
			linkCounts,
			rawLinkCounts,
			nodeLabelMap,
			avgPosition,
			maxDepth,
		);
	}, [
		nodes,
		filteredProfilesNames,
		availableProfilesWithPpmData,
		profilesScores,
		pathsDisplayMode,
		scoreEvolutionFilter,
		useScoreEvolutionFilter,
	]);
}
