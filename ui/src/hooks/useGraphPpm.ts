import type { PpmNodesDisplayMode } from "@/configuration";
import { useColombusStore } from "@/store";
import groupBy from "lodash/groupBy";
import { useEffect, useMemo, useState } from "react";
import type Sigma from "sigma";

const shouldHideNodeForModeMapping = {
	"show-all": () => false,
	"show-fixed": (allUuids, nodeUuid) =>
		nodeUuid && !allUuids.includes(nodeUuid),
	"show-variable": (allUuids, nodeUuid) =>
		nodeUuid && allUuids.includes(nodeUuid),
} as {
	[mode in PpmNodesDisplayMode]: (
		allUuids: string[],
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
			Object.entries(
				groupBy(availableProfilesWithPpmData, ([wfName]) => wfName),
			).flatMap(([, v]) => v[0].slice(1)),
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
