import type { PpmNodesDisplayMode } from "@/configuration";
import { useColombusStore } from "@/store";
import { useEffect, useMemo, useState } from "react";
import type Sigma from "sigma";

const shouldHideNodeForModeMapping = {
	"show-all": () => false,
	"show-fixed": (allUuids, nodeUuid) => nodeUuid && !allUuids.has(nodeUuid),
	"show-variable": (allUuids, nodeUuid) => nodeUuid && allUuids.has(nodeUuid),
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

	const allUuidsToDisplay = useMemo(
		() =>
			new Set([
				...availableProfilesWithPpmData.flatMap((v) => v.results.flat()),
			]),
		[availableProfilesWithPpmData],
	);

	useEffect(() => {
		if (availableProfilesWithPpmData.length === 0) {
			graphRenderer?.setSetting("nodeReducer", (nodeId, data) => {
				const res = { ...data };
				if (res.forceLabel) {
					res.label = res.fullLabel;
				} else {
					res.label = nodeId === hoveredNode ? res.fullLabel : ""; // res.shortLabel;
				}
				return res;
			});
		} else {
			graphRenderer?.setSetting("nodeReducer", (nodeId, data) => {
				const res = { ...data };
				if (
					res.layerLevel !== 1 && // always showing matched groups
					shouldHideNodeForModeMapping[patternCapturedNodesDisplayMode](
						allUuidsToDisplay,
						nodeId,
					)
				) {
					res.color = "#f6f6f6";
					res.forceLabel = false;
				}
				if (res.forceLabel) {
					res.label = res.fullLabel;
				} else {
					res.label = nodeId === hoveredNode ? res.fullLabel : ""; // res.shortLabel;
				}
				return res;
			});
		}
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
	]);

	useEffect(() => {
		graphRenderer?.on("enterNode", ({ node }) => {
			setHoveredNode(node);
		});
		graphRenderer?.on("leaveNode", () => {
			setHoveredNode(undefined);
		});
	}, [graphRenderer]);
}
