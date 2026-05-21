import type Graph from "graphology";
import { useCallback } from "react";
import type { GraphDefinition, StepNode } from "@/api/client";
import {
	algoNodeSuffix,
	colors,
	libraryFunctionNodeSuffix,
	stepsColorsMapping,
} from "@/configuration";
import type { Pattern, PpmResult } from "@/lib/types";
import { useColombusStore } from "@/store";
import { getDisplayProfileName } from "@/lib/utils";

function pairwise<T>(arr: T[], func: (e1: T, e2: T, i: number) => void) {
	for (let i = 0; i < arr.length - 1; i++) {
		func(arr[i], arr[i + 1], i);
	}
}

type PatternGroupNode = {
	id: string;
	name: string;
	position: number;
	number_children: number;
	number_sub_children: number;
	childrenIds: string[];
};

const getGroupsIds = (
	ppmResults: PpmResult[],
	currentPattern: Pattern | undefined,
	steps: StepNode[],
) => {
	const ppmCandiddates =
		currentPattern?.groups
			?.flatMap((g) => g?.subpattern?.groups ?? g)
			.filter((g) => g.steps?.length || g.subpattern) ?? [];
	const ppmNodes: PatternGroupNode[][] = [];
	for (const [ri, result] of ppmResults.entries()) {
		ppmNodes[ri] = result.results.map((r, i) => ({
			id: Math.random().toString(36),
			// TODO: sometimes ppmCandiddates can be undefined as the currentPattern
			// has changed but the ppm results corresponds to the previous pattern
			// until the API returns new ppm results
			name: `Match-${ri}_${ppmCandiddates?.[i]?.name ?? ""}`,
			position: i,
			number_children: r.length,
			number_sub_children: steps
				.filter((s) => r.includes(s.id))
				.reduce((prev, curr) => prev + curr.number_children, 0),
			childrenIds: r,
		}));
	}
	return ppmNodes;
};

export default function useGraphUtils(graph: Graph) {
	const displayedLevel = useColombusStore((state) => state.displayedLevel);
	const useWeightedNodes = useColombusStore((state) => state.useWeightedNodes);
	const availableProfilesNames = useColombusStore((state) => state.availableProfilesNames);

	const addNode = useCallback(
		(
			id: string,
			label: string,
			layerLevel: number,
			size: number,
			x: number,
			y: number,
		) => {
			graph.addNode(id, {
				label,
				x,
				y,
				size,
				color:
					layerLevel === 2
						? (stepsColorsMapping[label] ?? colors[layerLevel])
						: colors[layerLevel],
				layerLevel,
				forceLabel: layerLevel === 0, // always displaying workflow node name
				fullLabel: label,
				shortLabel: label
					.split(" ")
					.map(([l]) => l)
					.join(""),
			});
		},
		[graph],
	);

	const addEdge = useCallback(
		(n1Id: string, n2Id: string) => {
			graph.addEdge(n1Id, n2Id, {
				size: 1,
				type: "arrow",
			});
		},
		[graph],
	);

	const getNodesPositionsSimulation = useCallback(
		<T>(
			nodes: (T & { id: string; number_children?: number })[],
			startX: number,
		) => {
			return nodes.reduce(
				(prev, { number_children }) => ({
					nodesPositions: [
						...prev.nodesPositions,
						prev.totalSize + Math.round((5 * (number_children ?? 1)) / 2),
					],
					totalSize: prev.totalSize + 5 * (number_children ?? 1),
				}),
				{ nodesPositions: [], totalSize: startX } as {
					nodesPositions: number[];
					totalSize: number;
				},
			);
		},
		[],
	);

	const addNodes = useCallback(
		<T>(
			nodes: (T & { id: string; number_children?: number })[],
			layerLevel: number,
			x: number,
			y: number,
			getLabel: (node: T) => string,
			getParentId: (node: T) => string | undefined,
		) => {
			let addedX = x;
			if (nodes.length === 1) {
				const fullNodeSize = 5 * (nodes[0].number_children ?? 1);
				addNode(
					nodes[0].id,
					getLabel(nodes[0]),
					layerLevel,
					useWeightedNodes ? 5 + (nodes[0].number_children ?? 0) : 5,
					addedX + Math.round(fullNodeSize / 2),
					y - layerLevel * 50,
				);
				const parentId = getParentId(nodes[0]);
				if (parentId) {
					addEdge(parentId, nodes[0].id);
				}
				return addedX + fullNodeSize;
			}
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
						y - layerLevel * 50,
					);
					const n1ParentId = getParentId(n1);
					if (n1ParentId) {
						addEdge(n1ParentId, n1.id);
					}
				}
				const c2Size = useWeightedNodes ? 5 + (n2.number_children ?? 0) : 5;
				addedX += fullN1Size;
				addNode(
					n2.id,
					getLabel(n2),
					layerLevel,
					c2Size,
					addedX + Math.round(fullN2Size / 2),
					y - layerLevel * 50,
				);
				addEdge(n1.id, n2.id);
				const n2ParentId = getParentId(n2);
				if (n2ParentId) {
					addEdge(n2ParentId, n2.id);
				}
			});
			return addedX;
		},
		[addNode, addEdge, useWeightedNodes],
	);

	const addNewProfile = useCallback(
		(
			{ id, name, steps, meta_instructions, codes }: GraphDefinition,
			ppmResults: PpmResult[] | undefined, // expected to be results for the given profile
			currentPattern: Pattern | undefined,
			x: number,
			y: number,
		) => {
			let addedX = x;
			if (displayedLevel >= 1) {
				const displayName = getDisplayProfileName(name, availableProfilesNames);
				addNode(id, displayName, 0, 5, addedX + Math.round((5 * codes.length) / 2), y);
			}
			if (displayedLevel >= 2) {
				const hasPpmGroups = ppmResults; // && currentPattern;
				const groupsNodes = hasPpmGroups
					? getGroupsIds(ppmResults, currentPattern, steps)
					: [];
				if (hasPpmGroups) {
					const stepsPositions = getNodesPositionsSimulation(steps, addedX);
					// displaying matched ppm groups
					for (const grpNodes of groupsNodes) {
						let prevNodeId: string | undefined;
						for (const node of grpNodes) {
							const startStepX = steps.findIndex(
								(s) => s.id === node.childrenIds[0],
							);
							const endStepX = steps.findIndex(
								(s) => s.id === node.childrenIds[node.childrenIds.length - 1],
							);
							addNode(
								node.id,
								node.name,
								1,
								useWeightedNodes ? 5 + (node.number_children ?? 0) : 5,
								x +
								Math.round(
									(stepsPositions.nodesPositions[endStepX] +
										stepsPositions.nodesPositions[startStepX]) /
									2,
								),
								y - 50,
							);
							addEdge(id, node.id);
							if (prevNodeId) {
								addEdge(prevNodeId, node.id);
							}
							prevNodeId = node.id;
						}
					}
				}
				const flatGroupsNodes = groupsNodes.flat();
				addedX = Math.max(
					addedX,
					addNodes(
						steps,
						2,
						x,
						y,
						(s) => s.name,
						(s) =>
							hasPpmGroups
								? (flatGroupsNodes.find((g) => g.childrenIds.includes(s.id))
									?.id ?? id)
								: id,
					),
				);
			}
			if (displayedLevel >= 3) {
				addedX = Math.max(
					addedX,
					addNodes(
						meta_instructions.map((m) => ({
							...m,
							id: `${m.id}${algoNodeSuffix}`,
						})),
						3,
						x,
						y,
						(m) => `${m.algoFamily} | ${m.algoName}`,
						(m) => m.step_id,
					),
				);
			}
			if (displayedLevel >= 3) {
				addedX = Math.max(
					addedX,
					addNodes(
						meta_instructions.map((m) => ({
							...m,
							id: `${m.id}${libraryFunctionNodeSuffix}`,
						})),
						4,
						x,
						y,
						(m) => `${m.library} | ${m.function}`,
						(m) =>
							`${m.id.replace(libraryFunctionNodeSuffix, "")}${algoNodeSuffix}`,
					),
				);
			}
			if (displayedLevel >= 4) {
				addedX = Math.max(
					addedX,
					addNodes(
						codes,
						5,
						x,
						y,
						(c) => c.content,
						(c) => `${c.meta_instruction_id}-libfunc`,
					),
				);
			}
			return addedX;
		},
		[
			addNodes,
			addNode,
			addEdge,
			getNodesPositionsSimulation,
			useWeightedNodes,
			displayedLevel,
		],
	);

	return { addNewProfile };
}
