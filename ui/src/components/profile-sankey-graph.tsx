import { LocateFixed, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";
import type { GraphDefinition } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSankeyDataBuilder } from "@/hooks/explorer/useSankeyDataBuilder";
import { useColombusStore } from "@/store";
import ProfileSankeyGraphSettingsBar from "./profile-sankey-graph-settings-bar";

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
	const [zoom, setZoom] = useState(1);
	const innerRef = useRef<HTMLDivElement>(null);
	const outerRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef({
		isDragging: false,
		startX: 0,
		startY: 0,
		panX: 0,
		panY: 0,
	});

	const sankeyData = useSankeyDataBuilder({ nodes });

	const handlePlotClick = useCallback(
		(data: any) => {
			if (!data.points || data.points.length === 0) return;

			const point = data.points[0] as {
				source?: number;
				pointNumber?: number;
				index?: number;
				label?: string;
			};

			const isNode = point.source === undefined;
			if (!isNode) return;

			const idx = point.pointNumber ?? point.index;
			if (idx === undefined || !sankeyData?.nodeCustomData) return;

			const customDataStr = sankeyData.nodeCustomData[idx] as string;
			let nodeName = "";

			if (customDataStr) {
				nodeName = customDataStr.split("<br />")[0];
			} else if (sankeyData.nodeLabels?.[idx]) {
				nodeName = sankeyData.nodeLabels[idx].replace(/ \(\d+\)$/, "");
			} else if (point.label) {
				nodeName = point.label.replace(/ \(\d+\)$/, "");
			}

			if (nodeName && !nodeName.startsWith("_PADDING_")) {
				const trigger = `[step="${nodeName}"]`;
				useColombusStore.getState().setPatternAppendTrigger(trigger);
			}
		},
		[sankeyData],
	);

	const handleRecenter = useCallback(() => {
		if (outerRef.current && innerRef.current) {
			const defaultZoom = 0.2;

			setZoom(defaultZoom);
			dragRef.current.panX = 0;
			dragRef.current.panY = 0;
			innerRef.current.style.transform = `translate(0px, 0px) scale(${defaultZoom})`;
		}
	}, []);

	useEffect(() => {
		if (sankeyData) {
			// Small timeout to allow the DOM to render the inner and outer containers first
			const timer = setTimeout(() => {
				handleRecenter();
			}, 50);
			return () => clearTimeout(timer);
		}
	}, [sankeyData, handleRecenter]);

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
			<ProfileSankeyGraphSettingsBar className="absolute bottom-6 right-6 w-72 h-auto max-h-[calc(100%-3rem)] bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-[20px] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] z-10" />
			<div className="absolute bottom-6 right-[320px] flex flex-col bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-[20px] shadow-[0_10px_30px_rgba(15,23,42,0.06)] z-10">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" onClick={handleRecenter}>
								<LocateFixed />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Recenter</p>
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
										if (z < 0.25) return Math.min(0.25, z + 0.05);
										return Math.min(3, z + 0.15);
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
										return Math.max(0.25, z - 0.35);
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
					let newZoom = zoom - e.deltaY * 0.0005;
					newZoom = Math.min(3, Math.max(0.05, newZoom));
					setZoom(newZoom);

					if (innerRef.current) {
						innerRef.current.style.transform = `translate(${dragRef.current.panX}px, ${dragRef.current.panY}px) scale(${newZoom})`;
					}
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
						innerRef.current.style.transform = `translate(${dragRef.current.panX}px, ${dragRef.current.panY}px) scale(${zoom})`;
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
								? `${sankeyData.maxDepth * 100}px`
								: "100%",
						height: `${Math.max(100, sankeyData.uniqueNodesCount * 0.5)}%`,
						transformOrigin: "0 0",
						transform: `translate(${dragRef.current.panX}px, ${dragRef.current.panY}px) scale(${zoom})`,
					}}
				>
					<Plot
						onClick={handlePlotClick}
						data={[
							{
								type: "sankey",
								orientation: "h",
								arrangement: "fixed",
								node: {
									pad: 30,
									thickness: dynamicThickness,
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
									customdata: sankeyData?.linkCustomData,
									hovertemplate:
										"%{source.label} → %{target.label}<br /><span style='font-size:10px;color:#888'>Occurrences: %{value}<br />Avg Score: %{customdata[0]}</span><extra></extra>",
								},
							},
						]}
						layout={{
							autosize: true,
							dragmode: false,
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
