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
		<div className="w-full h-full flex flex-col items-center justify-center p-4">
			<h2 className="text-xl font-bold mb-4">Steps Frequency</h2>
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
	);
};

export default ProfileStepsFrequencyChart;
