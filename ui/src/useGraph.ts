import type { Neo4JEdge, Neo4JGraphDefinition, Neo4JNode } from "@/api/client";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { useEffect, useRef } from "react";
import Sigma from "sigma";

export default function useGraph(
	containerId: string | undefined,
	graphDefinition: Neo4JGraphDefinition | undefined,
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
		if (!graphDefinition) {
			return;
		}
		const colors = ["#C990C0", "#F79767", "#57C7E3", "#F16667", "#D9C8AE"];
		for (const v of graphDefinition) {
			if (
				filteredNodes &&
				!filteredNodes.includes((v[0] as Neo4JNode).properties.name)
			) {
				// filtering workflow nodes
				continue;
			}
			for (let i = 0; i < 13; i++) {
				try {
					if (i < displayedLevel) {
						const node = v[i] as Neo4JNode;
						graph.current.addNode(node.elementId, {
							label: node.properties.name,
							x: Math.random(),
							y: Math.random(),
							size: 5,
							color: colors[i],
							forceLabel: i === 0, // always displaying workflow node name
						});
					} else {
						const edge = v[i] as Neo4JEdge;
						graph.current.addEdge(
							edge.startNodeElementId,
							edge.endNodeElementId,
							{ label: edge.type, size: 1, type: "arrow" },
						);
					}
				} catch (error) {
					// error raised when duplicated nodes
				}
			}
		}
		forceAtlas2.assign(graph.current, 200);
	}, [graphDefinition, filteredNodes, displayedLevel]);

	useEffect(() => {
		renderer.current?.kill();
	}, []);
}
