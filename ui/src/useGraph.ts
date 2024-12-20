import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { useEffect, useRef } from "react";
import Sigma from "sigma";

export default function useGraph(
	containerId: string | undefined,
	data: any,
	filteredNodes: string[] | undefined,
	displayedLevel: number,
) {
	const graph = useRef<Graph>(new Graph());
	const renderer = useRef<Sigma | undefined>();

	useEffect(() => {
		if (containerId) {
			renderer.current?.kill();
			const graphContainer = document.getElementById("graph-container");
			if (graphContainer) {
				renderer.current = new Sigma(graph.current, graphContainer);
			}
		}
	}, [containerId]);

	useEffect(() => {
		if (!renderer.current || !graph.current) {
			return;
		}
		graph.current.clear();
		if (!data) {
			return;
		}
		const colors = ["#C990C0", "#F79767", "#57C7E3", "#F16667", "#D9C8AE"];
		for (const v of data.values) {
			if (filteredNodes && !filteredNodes.includes(v[0].properties.name)) {
				// filtering workflow nodes
				continue;
			}
			for (let i = 0; i < 13; i++) {
				try {
					if (i < displayedLevel) {
						graph.current.addNode(v[i].elementId, {
							label: v[i].properties.name,
							x: Math.random(),
							y: Math.random(),
							size: 5,
							color: colors[i],
							forceLabel: i === 0, // always displaying workflow node name
						});
					} else {
						graph.current.addEdge(
							v[i].startNodeElementId,
							v[i].endNodeElementId,
							{ label: v[i].type, size: 1, type: "arrow" },
						);
					}
				} catch (error) {
					// error raised when duplicated nodes
				}
			}
		}
		forceAtlas2.assign(graph.current, 200);
	}, [data, filteredNodes, displayedLevel]);

	useEffect(() => {
		renderer.current?.kill();
	}, []);
}
