import { FileCode2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs } from "react-syntax-highlighter/dist/esm/styles/prism";

import type { GraphDefinition, StepNode } from "@/api/client";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getStepIcon, stepsColorsMapping } from "@/configuration";
import type { Pattern, PpmResult } from "@/lib/types";
import { hexToRgba } from "@/lib/utils";
import { useColombusStore } from "@/store";

interface ProfileCodeViewerProps {
	nodes?: GraphDefinition[];
	overrideSelectedNodeId?: string | null;
	overridePattern?: Pattern | null;
	overridePpmData?: PpmResult[];
}

export default function ProfileCodeViewer({
	nodes,
	overrideSelectedNodeId,
	overridePattern,
	overridePpmData,
}: ProfileCodeViewerProps) {
	const storeSelectedNodeId = useColombusStore(
		(state) => state.selectedProfileNodeId,
	);
	const setSelectedProfileNodeId = useColombusStore(
		(state) => state.setSelectedProfileNodeId,
	);
	const setSelectedProfileName = useColombusStore(
		(state) => state.setSelectedProfileName,
	);

	const selectedNodeId =
		overrideSelectedNodeId !== undefined
			? overrideSelectedNodeId
			: storeSelectedNodeId;

	const handleNodeSelect = useCallback(
		(id: string | null) => {
			setSelectedProfileNodeId(id);
			if (id && nodes) {
				const node = nodes.find((n) => n.id === id);
				setSelectedProfileName(node ? node.name : null);
			} else {
				setSelectedProfileName(null);
			}
		},
		[nodes, setSelectedProfileNodeId, setSelectedProfileName],
	);

	const [selectedStepIds, setSelectedStepIds] = useState<Set<string>>(
		new Set(),
	);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const storePattern = useColombusStore((state) => state.currentPattern);
	const currentPattern =
		overridePattern !== undefined ? overridePattern : storePattern;

	const storeAvailableProfilesWithPpmData = useColombusStore(
		(state) => state.availableProfilesWithPpmData,
	);
	const availableProfilesWithPpmData =
		overridePpmData !== undefined
			? overridePpmData
			: storeAvailableProfilesWithPpmData;

	useEffect(() => {
		if (!nodes || nodes.length === 0) {
			handleNodeSelect(null);
			return;
		}
		if (selectedNodeId && !nodes.find((n) => n.id === selectedNodeId)) {
			handleNodeSelect(null);
		}
	}, [nodes, selectedNodeId, handleNodeSelect]);

	const activeNode = useMemo(() => {
		if (!nodes || !selectedNodeId) return null;
		return nodes.find((n) => n.id === selectedNodeId) || null;
	}, [nodes, selectedNodeId]);

	const displayedSteps = activeNode?.steps || [];

	const matchedStepIds = useMemo(() => {
		if (!activeNode || !currentPattern) return new Set<string>();
		const profileMatches = availableProfilesWithPpmData.filter(
			(p) => p.profile_name === activeNode.name,
		);
		return new Set(profileMatches.flatMap((p) => p.results.flat()));
	}, [activeNode, currentPattern, availableProfilesWithPpmData]);

	const getStepCode = useCallback((node: GraphDefinition, step: StepNode) => {
		const stepMeta =
			node.meta_instructions?.filter((m) => m.step_id === step.id) || [];
		const stepCodes = stepMeta.flatMap(
			(m) => node.codes?.filter((c) => c.meta_instruction_id === m.id) || [],
		);
		return stepCodes.map((c) => c.content).join("\n\n");
	}, []);

	const { fullCode, stepLineRanges } = useMemo(() => {
		if (!activeNode || displayedSteps.length === 0) {
			return {
				fullCode: "",
				stepLineRanges: [] as Array<{
					stepId: string;
					startLine: number;
					endLine: number;
				}>,
			};
		}
		const codes: string[] = [];
		const ranges: Array<{
			stepId: string;
			startLine: number;
			endLine: number;
		}> = [];
		let currentLine = 1;

		for (const step of displayedSteps) {
			const stepCode = getStepCode(activeNode, step);
			if (stepCode) {
				const lineCount = stepCode.split("\n").length;
				ranges.push({
					stepId: step.id,
					startLine: currentLine,
					endLine: currentLine + lineCount - 1,
				});
				codes.push(stepCode);
				currentLine += lineCount + 1;
			}
		}
		return { fullCode: codes.join("\n\n"), stepLineRanges: ranges };
	}, [activeNode, displayedSteps, getStepCode]);

	const scrollToLine = useCallback((startLine: number) => {
		if (!scrollContainerRef.current) return;
		const lineEl = scrollContainerRef.current.querySelector(
			`#code-line-${startLine}`,
		);
		if (lineEl) {
			lineEl.scrollIntoView({ behavior: "auto", block: "center" });
		}
	}, []);

	const handleStepClick = useCallback(
		(stepId: string) => {
			setSelectedStepIds((prev) => {
				const next = new Set(prev);
				if (next.has(stepId)) {
					next.delete(stepId);
				} else {
					next.add(stepId);
				}
				return next;
			});
			const stepRange = stepLineRanges.find((r) => r.stepId === stepId);
			if (stepRange) {
				scrollToLine(stepRange.startLine);
			}
		},
		[stepLineRanges, scrollToLine],
	);

	useEffect(() => {
		if (currentPattern && matchedStepIds.size > 0) {
			const firstRange = stepLineRanges.find((r) =>
				matchedStepIds.has(r.stepId),
			);
			if (firstRange) {
				scrollToLine(firstRange.startLine);
			}
		}
	}, [currentPattern, matchedStepIds, stepLineRanges, scrollToLine]);

	if (!nodes || nodes.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full min-h-[350px] p-8 text-slate-500">
				<FileCode2 className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
				<p>No notebooks or profiles selected.</p>
			</div>
		);
	}

	return (
		<div className="flex w-full h-full min-h-[350px] bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden font-sans text-slate-700">
			<div className="w-72 bg-slate-50/50 border-r border-slate-200 flex flex-col z-10 shrink-0 min-h-0">
				<div className="p-4 border-b border-slate-200">
					<Select
						value={selectedNodeId || undefined}
						onValueChange={handleNodeSelect}
					>
						<SelectTrigger className="w-full bg-white border-slate-200 text-slate-900 shadow-sm font-medium">
							<SelectValue placeholder="Select a profile" />
						</SelectTrigger>
						<SelectContent className="bg-white border-slate-200 text-slate-900">
							{nodes?.map((node) => (
								<SelectItem key={node.id} value={node.id}>
									{node.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex-1 overflow-y-auto p-3 space-y-2">
					{displayedSteps.length === 0 && (
						<div className="p-4 text-sm text-slate-500 italic text-center">
							No steps available.
						</div>
					)}
					{displayedSteps.map((step) => {
						const currentStepColor = stepsColorsMapping[step.name] || "#22d3ee";
						const isMatched = currentPattern
							? matchedStepIds.has(step.id)
							: true;
						const isSelected = selectedStepIds.has(step.id);

						return (
							<button
								key={step.id}
								type="button"
								className={`
									relative w-full group cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-slate-400
									rounded-lg overflow-hidden transition-all duration-200 border border-transparent
									${isSelected ? "shadow-[0_2px_10px_rgba(0,0,0,0.06)] bg-white" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}
									${!isMatched ? "opacity-40" : "opacity-100"}
								`}
								onClick={() => handleStepClick(step.id)}
								style={{
									borderColor: isSelected
										? hexToRgba(currentStepColor, 0.2)
										: "transparent",
								}}
							>
								<div
									className={`
										w-full flex items-center px-4 py-3 border-l-4
									`}
									style={{
										backgroundColor: isSelected
											? hexToRgba(currentStepColor, 0.08)
											: "transparent",
										borderLeftColor: isSelected
											? currentStepColor
											: isMatched && currentPattern
												? hexToRgba(currentStepColor, 0.5)
												: "transparent",
									}}
								>
									<div className="flex items-center space-x-3 relative z-10 w-full">
										<div
											className="p-1.5 rounded-md flex-shrink-0"
											style={{
												backgroundColor: isSelected
													? currentStepColor
													: hexToRgba(currentStepColor, 0.15),
												color: isSelected ? "white" : currentStepColor,
											}}
										>
											{getStepIcon(step.name)}
										</div>
										<div className="flex flex-col flex-1 min-w-0">
											<span
												className={`text-sm font-medium truncate ${isSelected ? "text-slate-900 font-bold" : "text-slate-700"}`}
											>
												{step.name}
											</span>
										</div>
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</div>

			<div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white">
				<div className="flex-1 p-6 flex flex-col min-h-0">
					<div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
						<div className="flex justify-between items-end px-4 pt-3 bg-slate-50 border-b border-slate-200">
							<div className="flex space-x-6 text-sm">
								<button
									type="button"
									className="pb-2 px-1 font-medium border-b-2 border-slate-900 text-slate-900"
								>
									Python
								</button>
							</div>
						</div>

						<div
							ref={scrollContainerRef}
							className="flex-1 w-full bg-white border-t border-slate-100 relative overflow-auto"
						>
							{fullCode ? (
								<SyntaxHighlighter
									language="python"
									style={vs}
									showLineNumbers
									lineNumberStyle={{
										color: "#94a3b8",
										minWidth: "3em",
										paddingRight: "1.5em",
										textAlign: "right",
										display: "inline-block",
										userSelect: "none",
									}}
									wrapLines={true}
									customStyle={{
										margin: 0,
										padding: "1rem",
										backgroundColor: "transparent",
										fontSize: "14px",
										lineHeight: "1.6",
									}}
									lineProps={(lineNumber) => {
										const baseStyle: React.CSSProperties = {
											display: "flex",
											flexDirection: "row",
											borderLeft: "3px solid transparent",
											backgroundColor: "transparent",
										};

										const matchingStepRange = stepLineRanges.find(
											(r) =>
												lineNumber >= r.startLine && lineNumber <= r.endLine,
										);

										if (!matchingStepRange) {
											return {
												id: `code-line-${lineNumber}`,
												style: baseStyle,
											};
										}

										const step = displayedSteps.find(
											(s) => s.id === matchingStepRange.stepId,
										);
										const stepColor = step
											? stepsColorsMapping[step.name] || "#22d3ee"
											: "#22d3ee";
										const isSelected = selectedStepIds.has(
											matchingStepRange.stepId,
										);
										const isMatched =
											currentPattern &&
											matchedStepIds.has(matchingStepRange.stepId);

										if (isSelected) {
											baseStyle.backgroundColor = hexToRgba(stepColor, 0.25);
											baseStyle.borderLeft = `3px solid ${stepColor}`;
										} else if (isMatched) {
											baseStyle.backgroundColor = hexToRgba(stepColor, 0.12);
											baseStyle.borderLeft = `3px solid ${hexToRgba(stepColor, 0.6)}`;
										}

										return {
											id: `code-line-${lineNumber}`,
											style: baseStyle,
										};
									}}
								>
									{fullCode}
								</SyntaxHighlighter>
							) : (
								<div className="flex items-center justify-center h-full text-slate-500 italic">
									No code available for this profile.
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
