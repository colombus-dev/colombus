import type { PpmNodesDisplayMode } from "@/configuration";
import groupBy from "lodash/groupBy";
import { useEffect, useMemo } from "react";
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

export default function useGraphPpm(
	ppmNodesDisplayMode: PpmNodesDisplayMode,
	graphRenderer?: Sigma,
	workflowsWithPpmData?: string[][],
) {
	const allUuidsToDisplay = useMemo(
		() =>
			Object.entries(
				groupBy(workflowsWithPpmData, ([wfName]) => wfName),
			).flatMap(([, v]) => v[0].slice(1)),
		[workflowsWithPpmData],
	);

	useEffect(() => {
		if (!workflowsWithPpmData) {
			graphRenderer?.setSetting("nodeReducer", (_, data) => data);
		} else {
			graphRenderer?.setSetting("nodeReducer", (_, data) => {
				const res = { ...data };
				if (
					shouldHideNodeForModeMapping[ppmNodesDisplayMode](
						allUuidsToDisplay,
						res.crossDbUuid,
					)
				) {
					res.color = "#f6f6f6";
					res.forceLabel = false;
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
		ppmNodesDisplayMode,
		workflowsWithPpmData,
		allUuidsToDisplay,
	]);
}
