import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { GraphDefinition } from "@/api/client";
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

		const rawLinkCounts: Record<string, Record<string, { matched: number; unmatched: number }>> = {};
		const nodePositions: Record<string, number[]> = {};
		const nodeLabelMap: Record<string, string> = {};

		for (const profile of nodes) {
			if (!filteredProfilesNames.includes(profile.name)) continue;

			const profilePpm = availableProfilesWithPpmData.find(
				(p) => p.profile_name === profile.name,
			);
			
			// Sort steps by position to ensure sequence is correct
			const steps = [...profile.steps].sort((a, b) => a.position - b.position);

			for (let i = 0; i < steps.length; i++) {
				const stepName = steps[i].name;
				if (!nodePositions[stepName]) nodePositions[stepName] = [];
				nodePositions[stepName].push(i);
				nodeLabelMap[stepName] = stepName;
			}

			const matchedRanges: { min: number; max: number }[] = [];
			
			if (profilePpm && profilePpm.results) {
				let globalMin = Number.MAX_SAFE_INTEGER;
				let globalMax = -1;

				for (const groupMatches of profilePpm.results) {
					for (const stepId of groupMatches) {
						const idx = steps.findIndex(s => s.id === stepId);
						if (idx !== -1) {
							if (idx < globalMin) globalMin = idx;
							if (idx > globalMax) globalMax = idx;
						}
					}
				}

				if (globalMin !== Number.MAX_SAFE_INTEGER) {
					// If only a single node matched (e.g. pattern with 1 group), highlight its outgoing link
					if (globalMin === globalMax) {
						globalMax = globalMin + 1;
					}
					matchedRanges.push({ min: globalMin, max: globalMax });
				}
			}

			for (let i = 0; i < steps.length - 1; i++) {
				const sourceId = steps[i].name;
				const targetId = steps[i + 1].name;

				if (sourceId === targetId) continue; // prevent self loops

				// Check if this specific transition [i -> i+1] is within any matched range
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
			avgPosition[node] = posArray.reduce((sum, val) => sum + val, 0) / posArray.length;
		}

		// Guarantee a Directed Acyclic Graph (DAG) by only keeping forward edges
		const linkCounts: Record<string, Record<string, { matched: number; unmatched: number }>> = {};
		for (const sourceId in rawLinkCounts) {
			for (const targetId in rawLinkCounts[sourceId]) {
				const posS = avgPosition[sourceId];
				const posT = avgPosition[targetId];
				
				// Keep edge if it flows forward in the average workflow.
				// Break ties arbitrarily (alphabetically) to absolutely prevent cycles.
				if (posS < posT || (posS === posT && sourceId < targetId)) {
					if (!linkCounts[sourceId]) linkCounts[sourceId] = {};
					linkCounts[sourceId][targetId] = rawLinkCounts[sourceId][targetId];
				}
			}
		}

		const uniqueNodes = Object.keys(nodeLabelMap);
		const nodeIndices = new Map<string, number>();
		uniqueNodes.forEach((nodeId, index) => {
			nodeIndices.set(nodeId, index);
		});

		const sources: number[] = [];
		const targets: number[] = [];
		const values: number[] = [];
		const colors: string[] = [];

		for (const sourceId in linkCounts) {
			for (const targetId in linkCounts[sourceId]) {
				const counts = linkCounts[sourceId][targetId];

				if (counts.unmatched > 0) {
					sources.push(nodeIndices.get(sourceId)!);
					targets.push(nodeIndices.get(targetId)!);
					values.push(counts.unmatched);
					colors.push("rgba(100, 100, 100, 0.4)");
				}
				if (counts.matched > 0) {
					sources.push(nodeIndices.get(sourceId)!);
					targets.push(nodeIndices.get(targetId)!);
					values.push(counts.matched);
					colors.push("rgba(34, 197, 94, 0.75)"); // distinct green for matched flows
				}
			}
		}

		return {
			nodeLabels: uniqueNodes.map((id) => nodeLabelMap[id]),
			sources,
			targets,
			values,
			colors,
		};
	}, [nodes, filteredProfilesNames, availableProfilesWithPpmData]);

	if (isLoading) {
		return (
			<div className={`flex items-center justify-center ${className || ""}`}>
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white" />
			</div>
		);
	}

	if (!sankeyData || sankeyData.sources.length === 0) {
		return (
			<div className={`flex items-center justify-center text-slate-500 ${className || ""}`}>
				No flow data available.
			</div>
		);
	}

	return (
		<div className={`w-full h-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.04)] border border-slate-200 dark:border-slate-800 ${className || ""}`}>
			<Plot
				data={[
					{
						type: "sankey",
						orientation: "h",
						node: {
							pad: 15,
							thickness: 20,
							line: {
								color: "rgba(0,0,0,0.5)",
								width: 0.5,
							},
							label: sankeyData.nodeLabels,
						},
						link: {
							source: sankeyData.sources,
							target: sankeyData.targets,
							value: sankeyData.values,
							color: sankeyData.colors,
						},
					},
				]}
				layout={{
					autosize: true,
					margin: { t: 40, l: 40, r: 40, b: 40 },
					font: {
						size: 11,
					},
					paper_bgcolor: "rgba(0,0,0,0)",
					plot_bgcolor: "rgba(0,0,0,0)",
				}}
				useResizeHandler={true}
				style={{ width: "100%", height: "100%" }}
			/>
		</div>
	);
}
