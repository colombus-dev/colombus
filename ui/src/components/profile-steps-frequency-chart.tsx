import { useEffect, useState } from "react";
import { useParams } from "react-router";
import BounceLoader from "react-spinners/BounceLoader";
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { postFrequentStepsData } from "@/api/client";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { useColombusStore } from "@/store";

const chartConfig = {
	step: {
		label: "Step",
	},
} satisfies ChartConfig;

const ProfileStepsFrequencyChart: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = () => {
	const { projectId } = useParams<{ projectId: string }>();
	const [frequentStepsData, setFrequentStepsData] =
		useState<{ step: string; frequency: number }[]>();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const availableProfilesNames = useColombusStore(
		(state) => state.availableProfilesNames,
	);

	useEffect(() => {
		if (projectId && availableProfilesNames.length > 0) {
			setIsLoading(true);
			postFrequentStepsData(projectId, availableProfilesNames).then((res) => {
				setFrequentStepsData(res);
				setIsLoading(false);
			});
		}
	}, [projectId, availableProfilesNames]);

	if (!projectId || availableProfilesNames.length === 0) {
		return null;
	}

	return (
		<div className="w-full h-full flex flex-col">
			<div className="mb-6 text-center w-full shrink-0">
				<h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
					Steps frequency
				</h2>
				<p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
					Global steps distribution
				</p>
			</div>
			<div className="flex-1 flex items-center justify-center w-full">
				{isLoading ? (
					<BounceLoader color="green" loading={isLoading} />
				) : (
					<ChartContainer config={chartConfig} className="w-full max-h-[500px]">
						<RadarChart data={frequentStepsData}>
							<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
							<PolarGrid />
							<PolarAngleAxis dataKey="step" />
							<Radar
								name="Steps"
								dataKey="frequency"
								stroke="#8884d8"
								fill="#8884d8"
								fillOpacity={0.6}
								dot={{
									r: 2,
									fillOpacity: 1,
								}}
							/>
							<Legend />
						</RadarChart>
					</ChartContainer>
				)}
			</div>
		</div>
	);
};

export default ProfileStepsFrequencyChart;
