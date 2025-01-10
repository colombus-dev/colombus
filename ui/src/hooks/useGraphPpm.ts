import groupBy from "lodash/groupBy";
import { useEffect } from "react";
import type Sigma from "sigma";

export default function useGraphPpm(
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
				if (res.crossDbUuid && !allUuidsToDisplay.includes(res.crossDbUuid)) {
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
	}, [workflowsWithPpmData, graphRenderer]);
}
