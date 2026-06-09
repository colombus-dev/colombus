import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import type Sigma from "sigma";
import {
	algoNodeSuffix,
	libraryFunctionNodeSuffix,
	type PpmNodesDisplayMode,
} from "@/configuration";
import { useColombusStore } from "@/store";

const shouldHideNodeForModeMapping = {
	"show-all": () => false,
	"show-fixed": (allUuids, nodeUuid) => {
		if (!nodeUuid) return false;
		const originalUuid = nodeUuid.split("::").pop() || nodeUuid;
		return !allUuids.has(
			originalUuid
				.replace(algoNodeSuffix, "")
				.replace(libraryFunctionNodeSuffix, ""),
		);
	},
	"show-variable": (allUuids, nodeUuid) => {
		if (!nodeUuid) return false;
		const originalUuid = nodeUuid.split("::").pop() || nodeUuid;
		return allUuids.has(
			originalUuid
				.replace(algoNodeSuffix, "")
				.replace(libraryFunctionNodeSuffix, ""),
		);
	},
} as {
	[mode in PpmNodesDisplayMode]: (
		allUuids: Set<string>,
		nodeUuid: string | undefined,
	) => boolean;
};

export default function useGraphPpm(graphRenderer?: Sigma) {
	const patternCapturedNodesDisplayMode = useColombusStore(
		(state) => state.patternCapturedNodesDisplayMode,
	);
	const availableProfilesWithPpmData = useColombusStore(
		(state) => state.availableProfilesWithPpmData,
	);
	const [hoveredNode, setHoveredNode] = useState<string | undefined>();
	const [hoveredNeighbors, setHoveredNeighbors] = useState<
		Set<string> | undefined
	>();
	// TODO: should we useParams or useValidProject ?
	const { projectId } = useParams<{ projectId: string }>();

	const getHoveredTopTree = useCallback(
		(parentNodeId: string): string[] => {
			const graph = graphRenderer?.getGraph();
			if (!graph) {
				return [];
			}
			const parentNodeLayeredLevel = graph.getNodeAttribute(
				parentNodeId,
				"layerLevel",
			);
			return [
				parentNodeId,
				...graph
					.inNeighbors(parentNodeId)
					.filter(
						(n) =>
							graph.getNodeAttribute(n, "layerLevel") < parentNodeLayeredLevel,
					)
					.flatMap(getHoveredTopTree),
			];
		},
		[graphRenderer],
	);

	const getHoveredSubTree = useCallback(
		(parentNodeId: string): string[] => {
			const graph = graphRenderer?.getGraph();
			if (!graph) {
				return [];
			}
			const parentNodeLayeredLevel = graph.getNodeAttribute(
				parentNodeId,
				"layerLevel",
			);
			return [
				parentNodeId,
				...graph
					.outNeighbors(parentNodeId)
					.filter(
						(n) =>
							graph.getNodeAttribute(n, "layerLevel") > parentNodeLayeredLevel,
					)
					.flatMap(getHoveredSubTree),
			];
		},
		[graphRenderer],
	);

	useEffect(() => {
		setHoveredNeighbors(
			hoveredNode
				? new Set([
						...getHoveredSubTree(hoveredNode),
						...getHoveredTopTree(hoveredNode),
					])
				: undefined,
		);
	}, [getHoveredSubTree, getHoveredTopTree, hoveredNode]);

	const allUuidsToDisplay = useMemo(
		() =>
			new Set([
				...availableProfilesWithPpmData.flatMap((v) => v.results.flat()),
			]),
		[availableProfilesWithPpmData],
	);

	useEffect(() => {
		graphRenderer?.setSetting("nodeReducer", (nodeId, data) => {
			const res = { ...data };
			const hoverShouldDisplayNode =
				nodeId === hoveredNode || hoveredNeighbors?.has(nodeId);
			if (
				(availableProfilesWithPpmData.length > 0 || hoveredNode) &&
				!hoverShouldDisplayNode &&
				res.layerLevel > 1 && // always showing matched groups
				shouldHideNodeForModeMapping[patternCapturedNodesDisplayMode](
					allUuidsToDisplay,
					nodeId,
				)
			) {
				res.color = "#f6f6f6";
				res.forceLabel = false;
			}
			if (res.forceLabel || data.layerLevel === 2 || data.layerLevel === 0) {
				// always display root and steps full label
				res.label = res.fullLabel;
				res.forceLabel = true;
			} else {
				res.label = nodeId === hoveredNode ? res.fullLabel : ""; // res.shortLabel;
			}
			return res;
		});
		graphRenderer?.refresh({
			// We don't touch the graph data so we can skip its reindexation
			skipIndexation: true,
		});
	}, [
		graphRenderer,
		patternCapturedNodesDisplayMode,
		availableProfilesWithPpmData,
		allUuidsToDisplay,
		hoveredNode,
		hoveredNeighbors,
	]);

	useEffect(() => {
		const graph = graphRenderer?.getGraph();
		if (!graph || !projectId) {
			return;
		}
		const hoveredNodeLayerLevel = hoveredNode
			? graph.getNodeAttribute(hoveredNode, "layerLevel")
			: undefined;
		let i = 0;
		while (graph.hasNode(`cell_output_${i}`)) {
			graph.dropNode(`cell_output_${i}`);
			i++;
		}
		if (
			!hoveredNode ||
			hoveredNodeLayerLevel === undefined ||
			hoveredNodeLayerLevel > 2
		) {
			return;
		}
		// TODO: temporary disabled
		// getOutputImagesForStep(projectId, hoveredNode).then((d) => {
		// 	if (d.length === 0) {
		// 		return;
		// 	}
		// 	const totalImagesWidth = 55 * d.length;
		// 	for (const [i, imageData] of d.entries()) {
		// 		graph.addNode(`cell_output_${i}`, {
		// 			x:
		// 				graph.getNodeAttribute(hoveredNode, "x") +
		// 				55 * i -
		// 				Math.round(totalImagesWidth / 4),
		// 			y: graph.getNodeAttribute(hoveredNode, "y") + 25,
		// 			size: 50,
		// 			type: "image",
		// 			label: "output",
		// 			image: `data:image/png;base64,${imageData}`,
		// 			color: "white",
		// 		});
		// 	}
		// });
	}, [graphRenderer, projectId, hoveredNode]);

	useEffect(() => {
		graphRenderer?.on("enterNode", ({ node }) => {
			setHoveredNode(node);
		});
		graphRenderer?.on("leaveNode", () => {
			setHoveredNode(undefined);
		});
	}, [graphRenderer]);
}
