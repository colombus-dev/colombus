import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { postFrequentStepsData } from "@/api/client";
import { SectionHeading } from "@/components/section-heading";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Spinner } from "@/components/ui/spinner";
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

	if (!projectId || availableProfilesNames.length === 0 || !frequentStepsData) {
		return null;
	}

	return (
		<div className="flex h-full w-full flex-col rounded-lg border p-4">
			<SectionHeading
				className="mb-4"
				title="Steps frequency"
				description="Global steps distribution"
			/>
			<div className="flex-1 flex items-center justify-center w-full">
				{isLoading ? (
					<Spinner />
				) : (
					<ChartContainer config={chartConfig} className="w-full max-h-125">
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
