import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { GraphDefinition } from "@/api/client";
import { stepsColorsMapping } from "@/configuration";
import { useColombusStore } from "@/store";

type ProfileSankeyGraphProps = {
	nodes: GraphDefinition[] | undefined;
	isLoading?: boolean;
	className?: string;
};

export default function ProfileSankeyGraph({
	nodes,
	isLoading,
	className,
}: ProfileSankeyGraphProps) {
	const filteredProfilesNames = useColombusStore(
		(state) => state.filteredProfilesNames,
	);
	const availableProfilesWithPpmData = useColombusStore(
		(state) => state.availableProfilesWithPpmData,
	);

	const sankeyData = useMemo(() => {
		if (!nodes || nodes.length === 0) return null;

		const rawLinkCounts: Record<
			string,
			Record<string, { matched: number; unmatched: number }>
		> = {};
		const nodePositions: Record<string, number[]> = {};
		const nodeLabelMap: Record<string, string> = {};

		for (const profile of nodes) {
			if (!filteredProfilesNames.includes(profile.name)) continue;

			const profilePpm = availableProfilesWithPpmData.find(
				(p) => p.profile_name === profile.name,
			);

			const steps = [...profile.steps].sort((a, b) => a.position - b.position);

			const unrolledIds: string[] = [];
			for (let i = 0; i < steps.length; i++) {
				const step = steps[i];
				const cleanName = step.name.trim();

				// Chronological unrolling: merge same step name at position (i + 1)
				// This groups common steps at each depth index into a single node
				const unrolledId = `${cleanName} (${i + 1})`;
				unrolledIds.push(unrolledId);
			}

			for (let i = 0; i < steps.length; i++) {
				const stepName = unrolledIds[i];
				if (!nodePositions[stepName]) nodePositions[stepName] = [];
				nodePositions[stepName].push(i);
				nodeLabelMap[stepName] = stepName;
			}

			const matchedRanges: { min: number; max: number }[] = [];

			if (profilePpm?.results) {
				let globalMin = Number.MAX_SAFE_INTEGER;
				let globalMax = -1;

				for (const groupMatches of profilePpm.results) {
					for (const stepId of groupMatches) {
						const idx = steps.findIndex((s) => s.id === stepId);
						if (idx !== -1) {
							if (idx < globalMin) globalMin = idx;
							if (idx > globalMax) globalMax = idx;
						}
					}
				}

				if (globalMin !== Number.MAX_SAFE_INTEGER) {
					if (globalMin === globalMax) {
						globalMax = globalMin + 1;
					}
					matchedRanges.push({ min: globalMin, max: globalMax });
				}
			}

			for (let i = 0; i < steps.length - 1; i++) {
				const sourceId = unrolledIds[i];
				const targetId = unrolledIds[i + 1];

				if (sourceId === targetId) continue;

				let isMatched = false;
				for (const range of matchedRanges) {
					if (i >= range.min && i < range.max) {
						isMatched = true;
						break;
					}
				}

				if (!rawLinkCounts[sourceId]) {
					rawLinkCounts[sourceId] = {};
				}
				if (!rawLinkCounts[sourceId][targetId]) {
					rawLinkCounts[sourceId][targetId] = { matched: 0, unmatched: 0 };
				}

				if (isMatched) {
					rawLinkCounts[sourceId][targetId].matched += 1;
				} else {
					rawLinkCounts[sourceId][targetId].unmatched += 1;
				}
			}
		}

		// Calculate average position for each node to determine natural left-to-right order
		const avgPosition: Record<string, number> = {};
		for (const node in nodePositions) {
			const posArray = nodePositions[node];
			avgPosition[node] =
				posArray.reduce((sum, val) => sum + val, 0) / posArray.length;
		}

		// Guarantee a Directed Acyclic Graph (DAG) by breaking cycles with a DFS.
		// To preserve the natural flow, we start the DFS from nodes with the lowest average position.
		// We use localeCompare to break ties deterministically!
		const sortedNodes = Object.keys(nodeLabelMap).sort((a, b) => {
			if (avgPosition[a] !== avgPosition[b])
				return avgPosition[a] - avgPosition[b];
			return a.localeCompare(b);
		});

		const linkCounts: Record<
			string,
			Record<string, { matched: number; unmatched: number }>
		> = {};
		const visited = new Set<string>();
		const recursionStack = new Set<string>();

		const removeCyclesDFS = (node: string) => {
			visited.add(node);
			recursionStack.add(node);

			if (rawLinkCounts[node]) {
				// Also sort neighbors deterministically
				const neighbors = Object.keys(rawLinkCounts[node]).sort((a, b) => {
					if (avgPosition[a] !== avgPosition[b])
						return avgPosition[a] - avgPosition[b];
					return a.localeCompare(b);
				});

				for (const neighbor of neighbors) {
					if (!visited.has(neighbor)) {
						if (!linkCounts[node]) linkCounts[node] = {};
						linkCounts[node][neighbor] = rawLinkCounts[node][neighbor];
						removeCyclesDFS(neighbor);
					} else if (!recursionStack.has(neighbor)) {
						// Cross edge or forward edge - safe to add
						if (!linkCounts[node]) linkCounts[node] = {};
						linkCounts[node][neighbor] = rawLinkCounts[node][neighbor];
					}
					// else: it's a back-edge (cycle) currently in the recursion stack, so we drop it visually.
					// The true flow counts will still be reflected in the tooltips via rawLinkCounts.
				}
			}

			recursionStack.delete(node);
		};

		for (const node of sortedNodes) {
			if (!visited.has(node)) {
				removeCyclesDFS(node);
			}
		}

		const nodeIncoming = new Map<string, number>();
		const nodeOutgoing = new Map<string, number>();

		for (const sourceId in rawLinkCounts) {
			for (const targetId in rawLinkCounts[sourceId]) {
				const counts = rawLinkCounts[sourceId][targetId];
				const val = counts.matched + counts.unmatched;
				nodeOutgoing.set(sourceId, (nodeOutgoing.get(sourceId) || 0) + val);
				nodeIncoming.set(targetId, (nodeIncoming.get(targetId) || 0) + val);
			}
		}

		// Ensure the node indices passed to Plotly are always in a strict, deterministic order
		// We sort chronologically first (by avgPosition), then by occurrence (thickness) descending
		const uniqueNodes = Object.keys(nodeLabelMap).sort((a, b) => {
			if (avgPosition[a] !== avgPosition[b])
				return avgPosition[a] - avgPosition[b];

			// Sort by occurrence (descending) to put thickest paths at the top
			const flowA = (nodeIncoming.get(a) || 0) + (nodeOutgoing.get(a) || 0);
			const flowB = (nodeIncoming.get(b) || 0) + (nodeOutgoing.get(b) || 0);
			if (flowA !== flowB) return flowB - flowA;

			return a.localeCompare(b);
		});

		const nodeIndices = new Map<string, number>();
		uniqueNodes.forEach((nodeId, index) => {
			nodeIndices.set(nodeId, index);
		});

		// nodeLabels is set to empty strings so they don't clutter the graph.
		// The real labels are moved to customData for the tooltips.
		const realNodeLabels = uniqueNodes.map((id) => nodeLabelMap[id]);
		const nodeLabels = uniqueNodes.map(() => "");

		const nodeColors = realNodeLabels.map((label) => {
			const baseLabel = label.replace(/ \(\d+\)$/, "");
			return stepsColorsMapping[baseLabel] || "rgba(128, 128, 128, 0.7)";
		});

		const sources: number[] = [];
		const targets: number[] = [];
		const values: number[] = [];
		const colors: string[] = [];

		for (const sourceId in linkCounts) {
			for (const targetId in linkCounts[sourceId]) {
				const counts = linkCounts[sourceId][targetId];
				const sIdx = nodeIndices.get(sourceId);
				const tIdx = nodeIndices.get(targetId);

				if (sIdx !== undefined && tIdx !== undefined) {
					if (counts.unmatched > 0) {
						sources.push(sIdx);
						targets.push(tIdx);
						values.push(counts.unmatched);
						colors.push("rgba(100, 100, 100, 0.4)");
					}
					if (counts.matched > 0) {
						sources.push(sIdx);
						targets.push(tIdx);
						values.push(counts.matched);
						colors.push("rgba(34, 197, 94, 0.75)"); // distinct green for matched flows
					}
				}
			}
		}

		const nodeCustomData = uniqueNodes.map((id, index) => {
			const label = realNodeLabels[index];
			const cleanName = label.replace(/ \(\d+\)$/, "");
			const totalFlow = Math.max(
				nodeIncoming.get(id) || 0,
				nodeOutgoing.get(id) || 0,
			);

			return [
				nodeIncoming.get(id) || 0,
				nodeOutgoing.get(id) || 0,
				cleanName,
				totalFlow,
			];
		});

		// Calculate maximum depth to dynamically set the width
		let maxDepth = 1;
		uniqueNodes.forEach((node) => {
			const match = node.match(/ \((\d+)\)$/);
			if (match) {
				const depth = Number.parseInt(match[1]);
				if (depth > maxDepth) maxDepth = depth;
			}
		});

		return {
			nodeLabels,
			nodeColors,
			nodeCustomData,
			sources,
			targets,
			values,
			colors,
			maxDepth,
		};
	}, [nodes, filteredProfilesNames, availableProfilesWithPpmData]);

	if (isLoading) {
		return (
			<div className={`flex items-center justify-center ${className || ""}`}>
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white" />
			</div>
		);
	}

	if (!nodes || nodes.length === 0 || !sankeyData) {
		return (
			<div className="flex items-center justify-center h-full w-full bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
				Aucune donnée de graphe
			</div>
		);
	}

	// Calculate a dynamic width based on the number of columns (depth)
	// Give the graph a dynamic thickness: the more stages (depth) there are, the thinner the nodes
	const dynamicThickness = sankeyData
		? Math.max(2, 30 - sankeyData.maxDepth * 0.6)
		: 20;
	// Use available white space, but keep a reasonable margin to avoid squeezing too much
	const dynamicVerticalMargin = sankeyData
		? Math.min(100, 20 + sankeyData.maxDepth * 1.5)
		: 40;

	return (
		<div
			className={`w-full h-full min-h-[250px] max-h-[50vh] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.04)] border border-slate-200 dark:border-slate-800 ${className || ""}`}
		>
			<Plot
				data={[
					{
						type: "sankey",
						orientation: "h",
						arrangement: "freeform",
						node: {
							pad: 30, // Increased padding to spread paths apart vertically
							thickness: dynamicThickness,
							line: {
								color: "rgba(0,0,0,0.5)",
								width: 0.5,
							},
							label: sankeyData.nodeLabels,
							color: sankeyData.nodeColors,
							// biome-ignore lint/suspicious/noExplicitAny: Plotly customdata prop type workaround
							customdata: sankeyData?.nodeCustomData as any,
							hovertemplate:
								"%{customdata[2]}<br /><span style='font-size:10px;color:#888'>Occurrences: %{customdata[3]}</span><extra></extra>",
						},
						link: {
							source: sankeyData?.sources,
							target: sankeyData?.targets,
							value: sankeyData?.values,
							color: sankeyData?.colors,
							hovertemplate: "<extra></extra>",
						},
					},
				]}
				layout={{
					autosize: true,
					margin: {
						t: dynamicVerticalMargin,
						l: 40,
						r: 40,
						b: dynamicVerticalMargin,
					},
					font: {
						size: 11,
					},
					paper_bgcolor: "rgba(0,0,0,0)",
					plot_bgcolor: "rgba(0,0,0,0)",
				}}
				useResizeHandler={true}
				config={{ responsive: true, displayModeBar: false }}
				style={{ width: "100%", height: "100%" }}
			/>
		</div>
	);
}
