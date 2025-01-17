import type { Neo4JEdge, Neo4JGraphDefinition, Neo4JNode } from "@/api/client";
import Graph from "graphology";
import groupBy from "lodash/groupBy";
import { useCallback, useEffect, useRef } from "react";
import Sigma from "sigma";
import { colors } from "../configuration";

const maxDisplayedLevel = 4;
const maxRowLength = 1000;

export default function useGraph(
	containerId: string | undefined,
	graphDefinition: Neo4JGraphDefinition | undefined,
	filteredNodes: string[] | undefined,
	displayedLevel = maxDisplayedLevel,
	weightedNodes = true,
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
							let nodeSize = 5;
							if (weightedNodes && i === 1) {
								nodeSize +=
									(v[1] as Neo4JNode).properties
										.numberRelatedMetaInstructions ?? 0;
							}
							const {
								elementId,
								properties: { name: label, cross_db_uuid: crossDbUuid },
							} = e as Neo4JNode;
							graph.current.addNode(elementId, {
								label,
								x: x + addedX,
								y: y - i * 50, // (vi + 1) * i + 5,
								size: nodeSize,
								color: colors[i],
								forceLabel: i === 0, // always displaying workflow node name
								crossDbUuid,
							});
						} else if (i < maxDisplayedLevel - 1) {
							// still a node but we don't display it as it is below the displayed level
						} else {
							const {
								startNodeElementId,
								endNodeElementId,
								type: label,
							} = e as Neo4JEdge;
							if (isNotLastNode && i === maxDisplayedLevel) {
								// we only connect the workflow node (e.g. last node of the array)
								// to the first step node
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
		[displayedLevel, weightedNodes],
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
			x += addNewWorkflow(wfGraphDefinition, x, y) + 250;
			if (x >= maxRowLength) {
				// we create a grid of profiles with maxRowLength
				y += 50 * displayedLevel;
				x = 1;
			}
		}
	}, [graphDefinition, filteredNodes, displayedLevel, addNewWorkflow]);

	useEffect(() => {
		return () => {
			renderer.current?.kill();
		};
	}, []);

	return { renderer };
}
