import type { GraphDefinition } from "@/api/client";
import { colors, stepsColorsMapping } from "@/configuration";
import { useColombusStore } from "@/store";
import Graph from "graphology";
import { useCallback, useEffect, useRef } from "react";
import Sigma from "sigma";

function pairwise<T>(arr: T[], func: (e1: T, e2: T, i: number) => void) {
	for (let i = 0; i < arr.length - 1; i++) {
		func(arr[i], arr[i + 1], i);
	}
}

export default function useGraph(
	containerId: string | undefined,
	graphDefinitions: GraphDefinition[] | undefined,
) {
	const displayedLevel = useColombusStore((state) => state.displayedLevel);
	const useWeightedNodes = useColombusStore((state) => state.useWeightedNodes);
	const filteredProfilesNames = useColombusStore(
		(state) => state.filteredProfilesNames,
	);

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

	const addNode = useCallback(
		(
			id: string,
			label: string,
			layerLevel: number,
			size: number,
			x: number,
			y: number,
		) => {
			graph.current.addNode(id, {
				label,
				x,
				y,
				size,
				color:
					layerLevel === 1
						? (stepsColorsMapping[label] ?? colors[layerLevel])
						: colors[layerLevel],
				forceLabel: layerLevel === 0, // always displaying workflow node name
				fullLabel: label,
				shortLabel: label
					.split(" ")
					.map(([l]) => l)
					.join(""),
			});
		},
		[],
	);

	const addEdge = useCallback((n1Id: string, n2Id: string) => {
		graph.current.addEdge(n1Id, n2Id, {
			size: 1,
			type: "arrow",
		});
	}, []);

	const addNodes = useCallback(
		<T>(
			nodes: (T & { id: string; number_children?: number })[],
			layerLevel: number,
			x: number,
			y: number,
			getLabel: (node: T) => string,
			getParentId: (node: T) => string,
		) => {
			let addedX = x;
			pairwise(nodes, (n1, n2, i) => {
				const fullN1Size = 5 * (n1.number_children ?? 1);
				const fullN2Size = 5 * (n2.number_children ?? 1);
				if (i === 0) {
					const c1Size = useWeightedNodes ? 5 + (n1.number_children ?? 0) : 5;
					addNode(
						n1.id,
						getLabel(n1),
						layerLevel,
						c1Size,
						addedX + Math.round(fullN1Size / 2),
						y - layerLevel * 10,
					);
					addEdge(getParentId(n1), n1.id);
				}
				const c2Size = useWeightedNodes ? 5 + (n2.number_children ?? 0) : 5;
				addedX += fullN1Size;
				addNode(
					n2.id,
					getLabel(n2),
					layerLevel,
					c2Size,
					addedX + Math.round(fullN2Size / 2),
					y - layerLevel * 10,
				);
				addEdge(n1.id, n2.id);
				addEdge(getParentId(n2), n2.id);
			});
			return addedX;
		},
		[addNode, addEdge, useWeightedNodes],
	);

	const addNewProfile = useCallback(
		(
			{ id, name, steps, meta_instructions, codes }: GraphDefinition,
			x: number,
			y: number,
		) => {
			let addedX = x;
			if (displayedLevel >= 1) {
				addNode(id, name, 0, 5, addedX + Math.round((5 * codes.length) / 2), y);
			}
			if (displayedLevel >= 2) {
				addedX = Math.max(
					addedX,
					addNodes(
						steps,
						1,
						x,
						y,
						(s) => s.name,
						() => id,
					),
				);
			}
			if (displayedLevel >= 3) {
				addedX = Math.max(
					addedX,
					addNodes(
						meta_instructions,
						2,
						x,
						y,
						(m) =>
							`${m.algoFamily} | ${m.algoName} | ${m.library} | ${m.function}`,
						(m) => m.step_id,
					),
				);
			}
			if (displayedLevel >= 4) {
				addedX = Math.max(
					addedX,
					addNodes(
						codes,
						3,
						x,
						y,
						(c) => c.content,
						(c) => c.meta_instruction_id,
					),
				);
			}
			return addedX;
		},
		[addNodes, addNode, displayedLevel],
	);

	useEffect(() => {
		graph.current?.clear();
		if (!graphDefinitions || !renderer.current || !graph.current) {
			return;
		}
		let addedX = 0;
		let addedY = 0;
		for (const profile of graphDefinitions) {
			if (!filteredProfilesNames.includes(profile.name)) {
				continue;
			}
			addNewProfile(profile, addedX, addedY);
			// TODO? if (addedX >= maxRowLength) {
			addedY -= 20 * displayedLevel;
			addedX = 1;
		}
	}, [graphDefinitions, filteredProfilesNames, displayedLevel, addNewProfile]);

	useEffect(() => {
		return () => {
			renderer.current?.kill();
		};
	}, []);

	return { renderer };
}
