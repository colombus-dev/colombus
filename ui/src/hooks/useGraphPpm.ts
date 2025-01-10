import type { PpmNodesDisplayMode } from "@/configuration";
import groupBy from "lodash/groupBy";
import { useEffect } from "react";
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
	useEffect(() => {
		if (!graphRenderer) {
			return;
		}
		if (!workflowsWithPpmData) {
			graphRenderer.setSetting("nodeReducer", (_, data) => data);
		} else {
			// TODO: improve readability
			const allUuidsToDisplay = Object.entries(
				groupBy(workflowsWithPpmData, ([wfName]) => wfName),
			).flatMap(([, [, [, ...wfPpmDataArray]]]) => wfPpmDataArray);

			graphRenderer.setSetting("nodeReducer", (_, data) => {
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
		graphRenderer.refresh({
			// We don't touch the graph data so we can skip its reindexation
			skipIndexation: true,
		});
	}, [workflowsWithPpmData, graphRenderer, ppmNodesDisplayMode]);
}
