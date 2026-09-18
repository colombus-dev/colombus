import { ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Plot from "react-plotly.js";
import type { GraphDefinition } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { stepsColorsMapping } from "@/configuration";
import { hexToRgba } from "@/lib/utils";
import { useColombusStore } from "@/store";
import ProfileExplorer2GraphSettingsBar from "./profile-explorer2-graph-settings-bar";

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
	const profilesScores = useColombusStore((state) => state.profilesScores);
	const pathsDisplayMode = useColombusStore((state) => state.pathsDisplayMode);
	const scoreEvolutionFilter = useColombusStore(
		(state) => state.scoreEvolutionFilter,
	);
	const useScoreEvolutionFilter = useColombusStore(
		(state) => state.useScoreEvolutionFilter,
	);

	const [zoom, setZoom] = useState(1);
	const innerRef = useRef<HTMLDivElement>(null);
	const outerRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef({
		isDragging: false,
		startX: 0,
		startY: 0,
		panX: 0,
		panY: 0,
		currentZoom: 1,
		wheelTimeout: null as NodeJS.Timeout | null,
	});

	useEffect(() => {
		dragRef.current.currentZoom = zoom;
	}, [zoom]);

	const sankeyData = useMemo(() => {
		if (!nodes || nodes.length === 0) return null;

		let maxDepth = 0;
		for (const profile of nodes) {
			if (!filteredProfilesNames.includes(profile.name)) continue;
			if (profile.steps.length > maxDepth) maxDepth = profile.steps.length;
		}

		const rawLinkCounts: Record<
			string,
			Record<string, Record<string, number>>
		> = {};
		const nodePositions: Record<string, number[]> = {};
		const nodeLabelMap: Record<string, string> = {};

		const nodeScoresAcc: Record<string, number[]> = {};
		const existingLinks: Record<string, Set<string>> = {};
		for (const profile of nodes) {
			if (!filteredProfilesNames.includes(profile.name)) continue;
			const score = profilesScores?.[profile.name];
			if (score === undefined || score === null) continue;

			const steps = [...profile.steps].sort((a, b) => a.position - b.position);
			const unrolledIds: string[] = [];
			for (let i = 0; i < maxDepth; i++) {
				if (i < steps.length) {
					const stepName = steps[i].name.replace(/ \(\d+\)$/, "");
					unrolledIds.push(`${stepName} (${i + 1})`);
				} else {
					unrolledIds.push(`_PADDING_${i + 1}`);
				}
			}

			for (const stepName of unrolledIds) {
				if (!nodeScoresAcc[stepName]) nodeScoresAcc[stepName] = [];
				nodeScoresAcc[stepName].push(score);
			}

			for (let i = 0; i < unrolledIds.length - 1; i++) {
				const src = unrolledIds[i];
				const tgt = unrolledIds[i + 1];
				if (!existingLinks[src]) existingLinks[src] = new Set();
				existingLinks[src].add(tgt);
			}
		}

		const avgNodeScore: Record<string, number> = {};
		for (const [nodeId, scores] of Object.entries(nodeScoresAcc)) {
			avgNodeScore[nodeId] = scores.reduce((a, b) => a + b, 0) / scores.length;
		}

		// removed getBandIndex

		const scoreToContinuousColor = (score: number | null | undefined) => {
			if (score === undefined || score === null) return "#94a3b8";
			const s = Math.max(0, Math.min(1, score));
			let r = 0,
				g = 0,
				b = 0;
			if (s < 0.5) {
				const ratio = s / 0.5;
				r = Math.round(239 + (250 - 239) * ratio);
				g = Math.round(68 + (204 - 68) * ratio);
				b = Math.round(68 + (21 - 68) * ratio);
			} else {
				const ratio = (s - 0.5) / 0.5;
				r = Math.round(250 + (34 - 250) * ratio);
				g = Math.round(204 + (197 - 204) * ratio);
				b = Math.round(21 + (94 - 21) * ratio);
			}
			const toHex = (c: number) => c.toString(16).padStart(2, "0");
			return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
		};

		const checkCondition = (src: string, tgt: string) => {
			if (!useScoreEvolutionFilter) return true;
			const isPadding =
				src.startsWith("_PADDING_") || tgt.startsWith("_PADDING_");
			if (isPadding) return true;
			const srcScore = avgNodeScore[src];
			const tgtScore = avgNodeScore[tgt];
			if (srcScore === undefined || tgtScore === undefined) return false;

			const delta = tgtScore - srcScore;

			if (scoreEvolutionFilter === 1) return delta <= 0;
			if (scoreEvolutionFilter === 2) return delta === 0;
			if (scoreEvolutionFilter === 3) return delta >= 0;
			return true;
		};

		const checkStrictCondition = (src: string, tgt: string) => {
			if (!useScoreEvolutionFilter) return false;
			const isPadding =
				src.startsWith("_PADDING_") || tgt.startsWith("_PADDING_");
			if (isPadding) return false;
			const srcScore = avgNodeScore[src];
			const tgtScore = avgNodeScore[tgt];
			if (srcScore === undefined || tgtScore === undefined) return false;
			const delta = tgtScore - srcScore;
			if (scoreEvolutionFilter === 1) return delta < 0;
			if (scoreEvolutionFilter === 3) return delta > 0;
			return false;
		};

		const nodesByDepth: string[][] = Array.from({ length: maxDepth }, () => []);
		for (const nodeId of Object.keys(nodeScoresAcc)) {
			let d = 0;
			if (nodeId.startsWith("_PADDING_")) {
				d = parseInt(nodeId.split("_")[2], 10) - 1;
			} else {
				const match = nodeId.match(/\((\d+)\)$/);
				if (match) {
					d = parseInt(match[1], 10) - 1;
				}
			}
			if (d >= 0 && d < maxDepth) {
				nodesByDepth[d].push(nodeId);
			}
		}

		const reachableFromStart = new Set<string>();
		const reachableFromStartStrict = new Set<string>();
		for (const nodeId of nodesByDepth[0]) reachableFromStart.add(nodeId);

		for (let d = 0; d < maxDepth - 1; d++) {
			for (const src of nodesByDepth[d]) {
				const isReach =
					reachableFromStart.has(src) || reachableFromStartStrict.has(src);
				if (!isReach) continue;
				const targets = existingLinks[src];
				if (targets) {
					for (const tgt of targets) {
						if (checkCondition(src, tgt)) {
							if (
								reachableFromStartStrict.has(src) ||
								checkStrictCondition(src, tgt)
							) {
								reachableFromStartStrict.add(tgt);
							} else {
								reachableFromStart.add(tgt);
							}
						}
					}
				}
			}
		}

		const canReachEnd = new Set<string>();
		const canReachEndStrict = new Set<string>();
		if (maxDepth > 0) {
			for (const nodeId of nodesByDepth[maxDepth - 1]) canReachEnd.add(nodeId);
			for (let d = maxDepth - 2; d >= 0; d--) {
				for (const src of nodesByDepth[d]) {
					const targets = existingLinks[src];
					if (targets) {
						for (const tgt of targets) {
							if (checkCondition(src, tgt)) {
								const isReachEnd =
									canReachEnd.has(tgt) || canReachEndStrict.has(tgt);
								if (isReachEnd) {
									if (
										canReachEndStrict.has(tgt) ||
										checkStrictCondition(src, tgt)
									) {
										canReachEndStrict.add(src);
									} else {
										canReachEnd.add(src);
									}
								}
							}
						}
					}
				}
			}
		}

		type TransitionBucket = {
			sumScore: number;
			numScores: number;
			count: number;
		};
		const aggregatedLinks: Record<
			string,
			Record<string, Record<string, TransitionBucket>>
		> = {};

		for (const profile of nodes) {
			if (!filteredProfilesNames.includes(profile.name)) continue;

			const profilePpm = availableProfilesWithPpmData.find(
				(p) => p.profile_name === profile.name,
			);

			const score = profilesScores?.[profile.name];

			const steps = [...profile.steps].sort((a, b) => a.position - b.position);

			const unrolledIds: string[] = [];
			for (let i = 0; i < maxDepth; i++) {
				if (i < steps.length) {
					const step = steps[i];
					const cleanName = step.name.trim();
					unrolledIds.push(`${cleanName} (${i + 1})`);
				} else {
					// Padding nodes to force left-alignment
					unrolledIds.push(`_PADDING_ (${i + 1})`);
				}
			}

			for (let i = 0; i < maxDepth; i++) {
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

			for (let i = 0; i < maxDepth - 1; i++) {
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

				const isPatternActive = !!profilePpm?.results;
				const isPadding =
					sourceId.startsWith("_PADDING_") || targetId.startsWith("_PADDING_");

				let bucketKey = "";
				let countToAdd = 1;

				if (isPadding) {
					bucketKey = "transparent";
					countToAdd = 1e-6;
				} else {
					const isReachStart =
						reachableFromStart.has(sourceId) ||
						reachableFromStartStrict.has(sourceId);
					const isReachEnd =
						canReachEnd.has(targetId) || canReachEndStrict.has(targetId);
					let partOfValidPath =
						checkCondition(sourceId, targetId) && isReachStart && isReachEnd;
					if (
						partOfValidPath &&
						useScoreEvolutionFilter &&
						(scoreEvolutionFilter === 1 || scoreEvolutionFilter === 3)
					) {
						partOfValidPath =
							reachableFromStartStrict.has(sourceId) ||
							checkStrictCondition(sourceId, targetId) ||
							canReachEndStrict.has(targetId);
					}

					if (!partOfValidPath) {
						bucketKey = "grey";
					} else if (isPatternActive) {
						if (pathsDisplayMode === "show-fixed") {
							bucketKey = isMatched ? "colored_0.75" : "grey";
						} else {
							bucketKey = "colored_0.6";
						}
					} else {
						bucketKey = "colored_0.6";
					}
				}

				if (!aggregatedLinks[sourceId]) {
					aggregatedLinks[sourceId] = {};
				}
				if (!aggregatedLinks[sourceId][targetId]) {
					aggregatedLinks[sourceId][targetId] = {};
				}
				if (!aggregatedLinks[sourceId][targetId][bucketKey]) {
					aggregatedLinks[sourceId][targetId][bucketKey] = {
						sumScore: 0,
						numScores: 0,
						count: 0,
					};
				}

				const bucket = aggregatedLinks[sourceId][targetId][bucketKey];
				bucket.count += countToAdd;
				if (score !== undefined && score !== null && !isPadding) {
					bucket.sumScore += score;
					bucket.numScores += 1;
				}
			}
		}

		for (const sourceId in aggregatedLinks) {
			if (!rawLinkCounts[sourceId]) {
				rawLinkCounts[sourceId] = {};
			}
			for (const targetId in aggregatedLinks[sourceId]) {
				if (!rawLinkCounts[sourceId][targetId]) {
					rawLinkCounts[sourceId][targetId] = {};
				}
				for (const bucketKey in aggregatedLinks[sourceId][targetId]) {
					const bucket = aggregatedLinks[sourceId][targetId][bucketKey];
					let linkColor = "";

					if (bucketKey === "transparent") {
						linkColor = "rgba(0,0,0,0)";
					} else if (bucketKey === "grey") {
						linkColor = "rgba(100, 100, 100, 0.15)";
					} else {
						const avgScore =
							bucket.numScores > 0 ? bucket.sumScore / bucket.numScores : 0;
						const colorHex = scoreToContinuousColor(avgScore);
						const alphaStr = bucketKey.split("_")[1];
						const alpha = parseFloat(alphaStr);
						linkColor = hexToRgba(colorHex, alpha);
					}

					if (!rawLinkCounts[sourceId][targetId][linkColor]) {
						rawLinkCounts[sourceId][targetId][linkColor] = 0;
					}
					rawLinkCounts[sourceId][targetId][linkColor] += bucket.count;
				}
			}
		}

		const avgPosition: Record<string, number> = {};
		for (const node in nodePositions) {
			const posArray = nodePositions[node];
			avgPosition[node] =
				posArray.reduce((sum, val) => sum + val, 0) / posArray.length;
		}

		const sortedNodes = Object.keys(nodeLabelMap).sort((a, b) => {
			if (avgPosition[a] !== avgPosition[b])
				return avgPosition[a] - avgPosition[b];
			return a.localeCompare(b);
		});

		const linkCounts: Record<
			string,
			Record<string, Record<string, number>>
		> = {};
		const visited = new Set<string>();
		const recursionStack = new Set<string>();

		const removeCyclesDFS = (node: string) => {
			visited.add(node);
			recursionStack.add(node);

			if (rawLinkCounts[node]) {
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
						if (!linkCounts[node]) linkCounts[node] = {};
						linkCounts[node][neighbor] = rawLinkCounts[node][neighbor];
					}
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
				const colorsDict = rawLinkCounts[sourceId][targetId];
				let val = 0;
				for (const color in colorsDict) {
					val += colorsDict[color];
				}
				nodeOutgoing.set(sourceId, (nodeOutgoing.get(sourceId) || 0) + val);
				nodeIncoming.set(targetId, (nodeIncoming.get(targetId) || 0) + val);
			}
		}

		const uniqueNodes = Object.keys(nodeLabelMap).sort((a, b) => {
			if (avgPosition[a] !== avgPosition[b])
				return avgPosition[a] - avgPosition[b];

			const flowA = (nodeIncoming.get(a) || 0) + (nodeOutgoing.get(a) || 0);
			const flowB = (nodeIncoming.get(b) || 0) + (nodeOutgoing.get(b) || 0);
			if (flowA !== flowB) return flowB - flowA;

			return a.localeCompare(b);
		});

		const nodeIndices = new Map<string, number>();
		uniqueNodes.forEach((nodeId, index) => {
			nodeIndices.set(nodeId, index);
		});

		const realNodeLabels = uniqueNodes.map((id) => nodeLabelMap[id]);
		const nodeLabels = uniqueNodes.map(() => "");

		const nodeColors = realNodeLabels.map((label) => {
			if (label.startsWith("_PADDING_")) return "rgba(0,0,0,0)";
			const baseLabel = label.replace(/ \(\d+\)$/, "");
			return stepsColorsMapping[baseLabel] || "rgba(128, 128, 128, 0.7)";
		});

		const sources: number[] = [];
		const targets: number[] = [];
		const values: number[] = [];
		const colors: string[] = [];

		for (const sourceId in linkCounts) {
			for (const targetId in linkCounts[sourceId]) {
				const colorsDict = linkCounts[sourceId][targetId];
				const sIdx = nodeIndices.get(sourceId);
				const tIdx = nodeIndices.get(targetId);

				if (sIdx !== undefined && tIdx !== undefined) {
					for (const linkColor in colorsDict) {
						const count = colorsDict[linkColor];
						if (count > 0) {
							sources.push(sIdx);
							targets.push(tIdx);
							values.push(count);
							colors.push(linkColor);
						}
					}
				}
			}
		}

		const nodeCustomData = uniqueNodes.map((id, index) => {
			if (id.startsWith("_PADDING_")) return "";
			const label = realNodeLabels[index];
			const cleanName = label.replace(/ \(\d+\)$/, "");
			const totalFlow = Math.max(
				nodeIncoming.get(id) || 0,
				nodeOutgoing.get(id) || 0,
			);

			return `${cleanName}<br /><span style="font-size:10px;color:#888">Occurrences: ${totalFlow}</span>`;
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
			uniqueNodesCount: uniqueNodes.length,
		};
	}, [
		nodes,
		filteredProfilesNames,
		availableProfilesWithPpmData,
		profilesScores,
		pathsDisplayMode,
		scoreEvolutionFilter,
		useScoreEvolutionFilter,
	]);

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

	const dynamicThickness = sankeyData
		? Math.max(10, 120 - sankeyData.maxDepth * 0.4)
		: 100;
	const dynamicVerticalMargin = sankeyData
		? Math.min(100, 20 + sankeyData.maxDepth * 1.5)
		: 40;

	return (
		<div
			className={`relative w-full h-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.04)] border border-slate-200 dark:border-slate-800 ${className || ""}`}
		>
			<ProfileExplorer2GraphSettingsBar className="absolute bottom-6 right-6 w-72 h-auto max-h-[calc(100%-3rem)] bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-[20px] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] z-10" />
			<div className="absolute bottom-6 right-[320px] flex flex-col bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-[20px] shadow-[0_10px_30px_rgba(15,23,42,0.06)] z-10">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								onClick={() =>
									setZoom((z) => {
										if (z < 0.25) return Math.min(0.25, z + 0.05);
										return Math.min(3, z + 0.25);
									})
								}
							>
								<ZoomIn />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Zoom In</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								onClick={() =>
									setZoom((z) => {
										if (z <= 0.25) return Math.max(0.05, z - 0.05);
										return Math.max(0.25, z - 0.25);
									})
								}
							>
								<ZoomOut />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Zoom Out</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			<div
				role="application"
				ref={outerRef}
				className="w-full h-full overflow-hidden cursor-grab"
				onWheel={(e) => {
					let newZoom = dragRef.current.currentZoom - e.deltaY * 0.002;
					newZoom = Math.min(3, Math.max(0.05, newZoom));
					dragRef.current.currentZoom = newZoom;

					if (innerRef.current) {
						innerRef.current.style.transform = `translate(${dragRef.current.panX}px, ${dragRef.current.panY}px) scale(${newZoom / zoom})`;
					}

					if (dragRef.current.wheelTimeout)
						clearTimeout(dragRef.current.wheelTimeout);
					dragRef.current.wheelTimeout = setTimeout(() => {
						setZoom(newZoom);
					}, 150);
				}}
				onMouseDown={(e) => {
					if (e.button !== 0) return;
					dragRef.current.isDragging = true;
					dragRef.current.startX = e.clientX - dragRef.current.panX;
					dragRef.current.startY = e.clientY - dragRef.current.panY;
					if (outerRef.current) {
						outerRef.current.classList.remove("cursor-grab");
						outerRef.current.classList.add("cursor-grabbing");
					}
				}}
				onMouseMove={(e) => {
					if (!dragRef.current.isDragging) return;
					dragRef.current.panX = e.clientX - dragRef.current.startX;
					dragRef.current.panY = e.clientY - dragRef.current.startY;
					if (innerRef.current) {
						innerRef.current.style.transform = `translate(${dragRef.current.panX}px, ${dragRef.current.panY}px) scale(${dragRef.current.currentZoom / zoom})`;
					}
				}}
				onMouseUp={() => {
					dragRef.current.isDragging = false;
					if (outerRef.current) {
						outerRef.current.classList.remove("cursor-grabbing");
						outerRef.current.classList.add("cursor-grab");
					}
				}}
				onMouseLeave={() => {
					dragRef.current.isDragging = false;
					if (outerRef.current) {
						outerRef.current.classList.remove("cursor-grabbing");
						outerRef.current.classList.add("cursor-grab");
					}
				}}
			>
				<div
					ref={innerRef}
					style={{
						minWidth: "100%",
						minHeight: "100%",
						width:
							sankeyData.maxDepth > 10
								? `${sankeyData.maxDepth * 100 * zoom}px`
								: `${zoom * 100}%`,
						height: `${Math.max(100, sankeyData.uniqueNodesCount * 0.5 * zoom)}%`,
						transformOrigin: "0 0",
						transform: `translate(${dragRef.current.panX}px, ${dragRef.current.panY}px) scale(${dragRef.current.currentZoom / zoom})`,
					}}
				>
					<Plot
						onClick={(data) => {
							if (data.points && data.points.length > 0) {
								const point = data.points[0] as {
									source?: number;
									pointNumber?: number;
									index?: number;
									label?: string;
								};

								const isNode = point.source === undefined;

								if (isNode) {
									const idx =
										point.pointNumber !== undefined
											? point.pointNumber
											: point.index;

									if (idx !== undefined && sankeyData.nodeCustomData) {
										const customDataStr = sankeyData.nodeCustomData[
											idx
										] as string;
										let nodeName = "";
										if (customDataStr) {
											nodeName = customDataStr.split("<br />")[0];
										} else if (sankeyData.nodeLabels?.[idx]) {
											nodeName = sankeyData.nodeLabels[idx].replace(
												/ \(\d+\)$/,
												"",
											);
										} else if (point.label) {
											nodeName = point.label.replace(/ \(\d+\)$/, "");
										}

										if (nodeName && !nodeName.startsWith("_PADDING_")) {
											const trigger = `[step="${nodeName}"]`;
											useColombusStore
												.getState()
												.setPatternAppendTrigger(trigger);
										}
									}
								}
							}
						}}
						data={[
							{
								type: "sankey",
								orientation: "h",
								arrangement: "fixed",
								node: {
									pad: 30 * zoom,
									thickness: dynamicThickness * zoom,
									line: {
										color: "rgba(0,0,0,0)",
										width: 0,
									},
									label: sankeyData.nodeLabels,
									color: sankeyData.nodeColors,
									customdata: sankeyData?.nodeCustomData as (
										| string
										| number
										| null
									)[],
									hovertemplate: "%{customdata}<extra></extra>",
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
			</div>
		</div>
	);
}
