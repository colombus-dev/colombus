import type { Neo4JEdge, Neo4JGraphDefinition, Neo4JNode } from "@/api/client";
import Graph from "graphology";
import groupBy from "lodash/groupBy";
import { useCallback, useEffect, useRef } from "react";
import Sigma from "sigma";
import { colors } from "./configuration";

const maxDisplayedLevel = 5;

export default function useGraph(
	containerId: string | undefined,
	graphDefinition: Neo4JGraphDefinition | undefined,
	filteredNodes: string[] | undefined,
	displayedLevel: number = maxDisplayedLevel,
) {
	const graph = useRef<Graph>(new Graph());
	const renderer = useRef<Sigma | undefined>();
	const displayedNodes = useRef<string[]>([]);

	useEffect(() => {
		if (containerId) {
			renderer.current?.kill();
			const graphContainer = document.getElementById("graph-container");
			if (graphContainer) {
				renderer.current = new Sigma(graph.current, graphContainer);
			}
		}
	}, [containerId]);

	const addNewWorkflow = useCallback(
		(wfGraphDefinition: Neo4JGraphDefinition, x: number) => {
			let addedX = 0;
			for (const [vi, v] of wfGraphDefinition.entries()) {
				for (const [i, e] of v.entries()) {
					try {
						if (i < displayedLevel) {
							const {
								elementId,
								properties: { name: label },
							} = e as Neo4JNode;
							graph.current.addNode(elementId, {
								label,
								x: x + addedX,
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
							if (vi < wfGraphDefinition.length - 1 && i === maxDisplayedLevel) {
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
				addedX += 5;
			}
			return addedX;
		},
		[displayedLevel],
	);

	useEffect(() => {
		graph.current?.clear();
		if (!graphDefinition || !renderer.current || !graph.current) {
			return;
		}
		const groupedBy = groupBy(
			graphDefinition,
			(v) => (v[0] as Neo4JNode).properties.name,
		);
		let x = 1;
		// TODO: to improve
		for (const [wfName, wfGraphDefinition] of Object.entries(groupedBy)) {
			if (filteredNodes && !filteredNodes.includes(wfName)) {
				// filtering workflow nodes
				continue;
			}
			x += addNewWorkflow(wfGraphDefinition, x) + 100;
		}
		displayedNodes.current = Object.keys(groupedBy);
	}, [graphDefinition, filteredNodes, addNewWorkflow]);

	useEffect(() => {
		return () => {
			renderer.current?.kill();
		};
	}, []);

	return { renderer };
}
