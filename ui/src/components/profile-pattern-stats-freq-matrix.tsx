import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useParams } from "react-router";
import BounceLoader from "react-spinners/BounceLoader";
import { postFrequentPatternsMatrixPlotly } from "@/api/client";
import { useColombusStore } from "@/store";

const ProfilePatternStatsFreqMatrix: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ className }) => {
	const { projectId } = useParams<{ projectId: string }>();
	const [plotData, setPlotData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const availableProfilesNames = useColombusStore(
		(state) => state.availableProfilesNames,
	);

	useEffect(() => {
		if (projectId && availableProfilesNames.length >= 2) {
			setIsLoading(true);
			postFrequentPatternsMatrixPlotly(projectId, availableProfilesNames)
				.then((res: any) => {
					setPlotData(res);
					setIsLoading(false);
				})
				.catch((err: any) => {
					console.error("Failed to load frequent patterns matrix:", err);
					setIsLoading(false);
				});
		} else {
			setPlotData(null);
		}
	}, [projectId, availableProfilesNames]);

	const injectTooltips = () => {
		if (!plotData) return;
		const yaxisLayer = document.querySelector(".yaxislayer-above");
		if (yaxisLayer?.parentNode) {
			yaxisLayer.parentNode.appendChild(yaxisLayer);
		}

		const yticks = document.querySelectorAll(".yaxislayer-above .ytick text");
		const ticktext = plotData.layout?.yaxis?.ticktext;
		const tickvals = plotData.layout?.yaxis?.tickvals;

		if (ticktext && tickvals) {
			yticks.forEach((tickNode: any) => {
				const text = tickNode.textContent;
				const index = ticktext.findIndex(
					(t: string) =>
						t === text ||
						tickNode.innerHTML.includes(t) ||
						(text && t.replace(/\.\.\./g, "") === text.replace(/\.\.\./g, "")),
				);
				if (index !== -1) {
					if (!tickNode.querySelector("title")) {
						const titleEl = document.createElementNS(
							"http://www.w3.org/2000/svg",
							"title",
						);
						titleEl.textContent = tickvals[index].replace(/<br>/g, "\n");
						tickNode.appendChild(titleEl);
						tickNode.style.pointerEvents = "all";
						tickNode.style.cursor = "help";
					}
				}
			});
		}
	};

	if (!projectId) {
		return null;
	}

	return (
		<div
			className={`w-full h-full relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] min-h-[500px] ${className || ""}`}
		>
			<div className="mb-6 text-center w-full">
				<h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
					Frequent patterns matrix (top 10)
				</h2>
				<p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
					Heatmap of patterns occurrences in the selected profiles. Hover over the blocks to see the exact frequencies.
				</p>
			</div>
			<div className="flex-1 w-full h-full min-h-[400px] relative">
				{isLoading ? (
					<BounceLoader color="green" loading={isLoading} />
				) : plotData ? (
					<Plot
						data={plotData.data}
						layout={{
							...plotData.layout,
							autosize: true,
						}}
						useResizeHandler={true}
						style={{
							width: "100%",
							height: "100%",
							position: "absolute",
							top: 0,
							left: 0,
						}}
						config={{ responsive: true, displaylogo: false, showTips: false }}
						onInitialized={injectTooltips}
						onUpdate={injectTooltips}
					/>
				) : (
					<p className="text-slate-500">
						Not enough profiles to display the matrix.
					</p>
				)}
			</div>
		</div>
	);
};

export default ProfilePatternStatsFreqMatrix;
