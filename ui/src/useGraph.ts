import type { Neo4JEdge, Neo4JGraphDefinition, Neo4JNode } from "@/api/client";
import Graph from "graphology";
import groupBy from "lodash/groupBy";
import { useCallback, useEffect, useRef } from "react";
import Sigma from "sigma";
import { colors } from "./configuration";

const maxDisplayedLevel = 5;
const maxRowLength = 1000;

let displayedNodes: string[] = [];

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

	const addNewWorkflow = useCallback(
		(wfGraphDefinition: Neo4JGraphDefinition, x: number, y: number) => {
			let addedX = 0;
			for (const [vi, v] of wfGraphDefinition.entries()) {
				for (const [i, e] of v.entries()) {
					const isNotLastNode = vi < wfGraphDefinition.length - 1;
					try {
						if (i < displayedLevel) {
							if (i === 0 && isNotLastNode) {
								// we add the workflow node at the beginning of the profile graph
								// correponding to the last node as the node array is reversed
								// (first nodes in the array are the last nodes in the profile)
								continue;
							}
							const {
								elementId,
								properties: { name: label },
							} = e as Neo4JNode;
							graph.current.addNode(elementId, {
								label,
								x: x - addedX,
								y: y - i * 50, // (vi + 1) * i + 5,
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
							if (isNotLastNode && i === maxDisplayedLevel) {
								// we only connect the workflow node (e.g. last node of the array)
								// to the first stage node
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
		let y = 1;
		for (const [wfName, wfGraphDefinition] of Object.entries(groupedBy)) {
			if (filteredNodes && !filteredNodes.includes(wfName)) {
				// filtering workflow nodes
				continue;
			}
			x += addNewWorkflow(wfGraphDefinition, x, y) + 100;
			if (x >= maxRowLength) {
				// we create a grid of profiles with maxRowLength
				y += 50 * displayedLevel;
				x = 1;
			}
		}
		displayedNodes = Object.keys(groupedBy);
	}, [graphDefinition, filteredNodes, displayedLevel, addNewWorkflow]);

	useEffect(() => {
		return () => {
			renderer.current?.kill();
		};
	}, []);

	return { renderer };
}
