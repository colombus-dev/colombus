import { useEffect, useState } from "react";
import { useParams } from "react-router";
import BounceLoader from "react-spinners/BounceLoader";
import Plot from "react-plotly.js";
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
				.then((res) => {
					setPlotData(res);
					setIsLoading(false);
				})
				.catch((err) => {
					console.error("Failed to load matrix:", err);
					setIsLoading(false);
				});
		} else {
			setPlotData(null);
		}
	}, [projectId, availableProfilesNames]);

	const injectTooltips = () => {
		if (!plotData) return;
		setTimeout(() => {
			const yaxisLayer = document.querySelector('.yaxislayer-above');
			if (yaxisLayer && yaxisLayer.parentNode) {
				yaxisLayer.parentNode.appendChild(yaxisLayer);
			}

			const yticks = document.querySelectorAll('.yaxislayer-above .ytick text');
			const ticktext = plotData.layout?.yaxis?.ticktext;
			const tickvals = plotData.layout?.yaxis?.tickvals;

			if (ticktext && tickvals) {
				yticks.forEach((tickNode: any) => {
					const text = tickNode.textContent;
					const index = ticktext.findIndex((t: string) =>
						t === text ||
						tickNode.innerHTML.includes(t) ||
						(text && t.replace(/\.\.\./g, '') === text.replace(/\.\.\./g, ''))
					);
					if (index !== -1) {
						if (!tickNode.querySelector('title')) {
							const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
							titleEl.textContent = tickvals[index].replace(/<br>/g, '\n');
							tickNode.appendChild(titleEl);
							tickNode.style.pointerEvents = 'all';
							tickNode.style.cursor = 'help';
						}
					}
				});
			}
		}, 300);
	};

	if (!projectId) {
		return null;
	}

	return (
		<div className={`w-full h-full relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] min-h-[500px] ${className || ""}`}>
			<h2 className="text-xl font-bold mb-4">Frequent Patterns Matrix (top 30)</h2>
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
						style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
						config={{ responsive: true, displaylogo: false }}
						onInitialized={injectTooltips}
						onUpdate={injectTooltips}
					/>
				) : (
					<p className="text-slate-500">Not enough profiles to display the matrix.</p>
				)}
			</div>
		</div>
	);
};

export default ProfilePatternStatsFreqMatrix;
