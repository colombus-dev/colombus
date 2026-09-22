import { stepsColorsMapping } from "@/configuration";
import type { RawLinkCountsMap } from "./sankey-types";

function calculateNodeFlows(rawLinkCounts: RawLinkCountsMap) {
	const nodeIncoming = new Map<string, number>();
	const nodeOutgoing = new Map<string, number>();

	for (const sourceId in rawLinkCounts) {
		for (const targetId in rawLinkCounts[sourceId]) {
			const colorsDict = rawLinkCounts[sourceId][targetId];
			let val = 0;
			for (const color in colorsDict) {
				val += colorsDict[color].count;
			}
			nodeOutgoing.set(sourceId, (nodeOutgoing.get(sourceId) || 0) + val);
			nodeIncoming.set(targetId, (nodeIncoming.get(targetId) || 0) + val);
		}
	}
	return { nodeIncoming, nodeOutgoing };
}

function processLinkColors(
	colorsDict: Record<string, { count: number; avgScore: number }>,
	sIdx: number,
	tIdx: number,
	sources: number[],
	targets: number[],
	values: number[],
	colors: string[],
	customdata: any[],
) {
	for (const linkColor in colorsDict) {
		const { count, avgScore } = colorsDict[linkColor];
		if (count > 0) {
			sources.push(sIdx);
			targets.push(tIdx);
			values.push(count);
			colors.push(linkColor);
			customdata.push([avgScore.toFixed(2)]);
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
	const customdata: any[] = [];

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
					customdata,
				);
			}
		}
	}
	return { sources, targets, values, colors, customdata };
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

export function formatSankeyData(
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
		linkCustomData: arrays.customdata,
		sources: arrays.sources,
		targets: arrays.targets,
		values: arrays.values,
		colors: arrays.colors,
		maxDepth,
		uniqueNodesCount: uniqueNodes.length,
	};
}
