import { useMemo } from "react";
import type { GraphDefinition } from "@/api/client";
import { useColombusStore } from "@/store";
import { aggregateLinkWeights } from "./sankey/sankey-aggregation";
import { removeCyclesFromGraph } from "./sankey/sankey-cycles";
import { formatSankeyData } from "./sankey/sankey-formatting";
import { computeReachability } from "./sankey/sankey-reachability";
import {
	buildGraphTopology,
	calculateMaxDepth,
} from "./sankey/sankey-topology";
import type { SankeyAggregationConfig } from "./sankey/sankey-types";

type SankeyDataBuilderProps = {
	nodes: GraphDefinition[] | undefined;
};

export function useSankeyDataBuilder({ nodes }: SankeyDataBuilderProps) {
	const filteredProfilesNames = useColombusStore(
		(state) => state.filteredProfilesNames,
	);
	const availableProfilesWithPpmData = useColombusStore(
		(state) => state.availableProfilesWithPpmData,
	);
	const profilesScores = useColombusStore((state) => state.profilesScores);
	const pathsDisplayMode = useColombusStore((state) => state.pathsDisplayMode);
	const scoreEvolutionFilter = useColombusStore(
		(state) => state.scoreEvolutionFilter,
	);
	const useScoreEvolutionFilter = useColombusStore(
		(state) => state.useScoreEvolutionFilter,
	);

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

		const { aggregatedLinks, nodePositions, nodeLabelMap, matchedNodes } =
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
			matchedNodes,
			pathsDisplayMode,
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
