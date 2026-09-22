import { hexToRgba, scoreToContinuousColor } from "@/lib/utils";
import type {
	AggregatedLinksMap,
	RawLinkCountsMap,
	TransitionBucket,
} from "./sankey-types";

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
		const avgScore =
			bucket.numScores > 0 ? bucket.sumScore / bucket.numScores : 0;

		if (bucketKey === "transparent") {
			linkColor = "rgba(0,0,0,0)";
		} else if (bucketKey === "grey" || bucketKey === "hidden") {
			linkColor = "rgba(100, 100, 100, 0.15)";
		} else {
			const colorHex = scoreToContinuousColor(avgScore);
			const alphaStr = bucketKey.split("_")[1];
			linkColor = hexToRgba(colorHex, Number.parseFloat(alphaStr));
		}
		if (!rawLinkCounts[sourceId][targetId][linkColor]) {
			rawLinkCounts[sourceId][targetId][linkColor] = { count: 0, avgScore: 0 };
		}

		const existing = rawLinkCounts[sourceId][targetId][linkColor];
		const totalCount = existing.count + bucket.count;
		if (totalCount > 0) {
			existing.avgScore =
				(existing.avgScore * existing.count + avgScore * bucket.count) /
				totalCount;
		}
		existing.count += bucket.count;
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

export function removeCyclesFromGraph(
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
