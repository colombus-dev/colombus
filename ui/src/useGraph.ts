import type { Neo4JEdge, Neo4JGraphDefinition, Neo4JNode } from "@/api/client";
import Graph from "graphology";
import groupBy from "lodash/groupBy";
import { useEffect, useRef } from "react";
import Sigma from "sigma";

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
		const groupedBy = groupBy(
			graphDefinition,
			(v) => (v[0] as Neo4JNode).properties.name,
		);
		// TODO: to improve
		let x = 1;
		for (const [vn, ve] of Object.entries(groupedBy)) {
			if (filteredNodes && !filteredNodes.includes(vn)) {
				// filtering workflow nodes
				continue;
			}
			for (const [vi, v] of ve.entries()) {
				for (const [i, e] of v.entries()) {
					try {
						if (i < displayedLevel) {
							const {
								elementId,
								properties: { name: label },
							} = e as Neo4JNode;
							graph.current.addNode(elementId, {
								label,
								x: x,
								y: i * 50, // (vi + 1) * i + 5,
								size: 5,
								color: colors[i],
								forceLabel: i === 0, // always displaying workflow node name
							});
						} else {
							const {
								startNodeElementId,
								endNodeElementId,
								type: label,
							} = e as Neo4JEdge;
							if (vi < ve.length - 1 && i === maxDisplayedLevel) {
								// we only connect the workflow node to the first stage node
								continue;
							}
							graph.current.addEdge(startNodeElementId, endNodeElementId, {
								label,
								size: 1,
								type: "arrow",
							});
						}
					} catch (error) {
						// error raised when duplicated nodes
					}
				}
				x += 5;
			}
			x += 100;
		}
	}, [graphDefinition, filteredNodes, displayedLevel]);

	useEffect(() => {
		return () => {
			renderer.current?.kill();
		};
	}, []);
}
