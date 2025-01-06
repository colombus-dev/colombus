import type { Neo4JEdge, Neo4JGraphDefinition, Neo4JNode } from "@/api/client";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { useEffect, useRef } from "react";
import Sigma from "sigma";
import groupBy from "lodash/groupBy";

const maxDisplayedLevel = 5;

export default function useGraph(
	containerId: string | undefined,
	graphDefinition: Neo4JGraphDefinition | undefined,
	filteredNodes: string[] | undefined,
	displayedLevel: number = maxDisplayedLevel,
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
		graph.current?.clear();
		if (!graphDefinition || !renderer.current || !graph.current) {
			return;
		}
		const colors = ["#C990C0", "#F79767", "#57C7E3", "#F16667", "#D9C8AE"];
		const groupedBy = groupBy(graphDefinition, (v) => v[0].elementId);
		// TODO: to improve
		for (const [_, ve] of Object.entries(groupedBy)) {
			for (const [vi, v] of ve.entries()) {
				if (
					filteredNodes &&
					!filteredNodes.includes((v[0] as Neo4JNode).properties.name)
				) {
					// filtering workflow nodes
					continue;
				}
				for (const [i, e] of v.entries()) {
					try {
						if (i < displayedLevel) {
							const {elementId, properties: {name: label}} = e as Neo4JNode;
							graph.current.addNode(elementId, {
								label,
								x: Math.random(),
								y: Math.random(),
								size: 5,
								color: colors[i],
								forceLabel: i === 0, // always displaying workflow node name
							});
						} else {
							const {startNodeElementId, endNodeElementId, type: label} = e as Neo4JEdge;
							if (vi < ve.length - 1 && i === maxDisplayedLevel) {
								continue;
							}
							graph.current.addEdge(
								startNodeElementId,
								endNodeElementId,
								{ label, size: 1, type: "arrow" },
							);
						}
					} catch (error) {
						// error raised when duplicated nodes
					}
				}
			}
		}
		forceAtlas2.assign(graph.current, 100);
	}, [graphDefinition, filteredNodes, displayedLevel]);

	useEffect(() => {
		return () => {
			renderer.current?.kill();
		};
	}, []);
}
