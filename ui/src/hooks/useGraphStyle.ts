import { useEffect, useState } from "react";
import type Sigma from "sigma";

export default function useGraphStyle(graphRenderer?: Sigma) {
	const [hoveredNode, setHoveredNode] = useState<string | undefined>();

	useEffect(() => {
		graphRenderer?.setSetting("nodeReducer", (nodeId, data) => {
			const res = { ...data };
			if (res.forceLabel) {
				res.label = res.fullLabel;
			} else {
				res.label = nodeId === hoveredNode ? res.fullLabel : ""; // res.shortLabel;
			}
			return res;
		});
		graphRenderer?.refresh({
			// We don't touch the graph data so we can skip its reindexation
			skipIndexation: true,
		});
	}, [graphRenderer, hoveredNode]);

	useEffect(() => {
		graphRenderer?.on("enterNode", ({ node }) => {
			setHoveredNode(node);
		});
		graphRenderer?.on("leaveNode", () => {
			setHoveredNode(undefined);
		});
	}, [graphRenderer]);
}
