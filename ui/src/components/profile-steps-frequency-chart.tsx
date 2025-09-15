import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { postFrequentStepsData } from "@/api/client";
import { useParams } from "react-router";
import BounceLoader from "react-spinners/BounceLoader";
import { Button } from "@/components/ui/button";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useColombusStore } from "@/store";
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

const chartConfig = {
	step: {
		label: "Step",
	}
} satisfies ChartConfig;

const ProfileStepsFrequencyChart: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = () => {
	const { projectId } = useParams<{ projectId: string }>();
	const [frequentStepsData, setFrequentStepsData] = useState<{ step: string, key: number }[]>();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const availableProfilesNames = useColombusStore((state) => state.availableProfilesNames);

	if (!projectId) {
		return;
	}

	return (
		<Dialog onOpenChange={(isOpen) => {
			if (isOpen) {
				setIsLoading(true);
				postFrequentStepsData(projectId, availableProfilesNames).then((res) => {
					setFrequentStepsData(res);
					setIsLoading(false);
				})
			} else {
				setIsLoading(false);
			}
		}}>
			<DialogTrigger asChild>
				<Button className="w-full">View Steps Frequency</Button>
			</DialogTrigger>
			<DialogContent className="min-w-[1200px]">
				<DialogHeader>
					<DialogTitle>Steps Frequency</DialogTitle>
					<DialogDescription>
						{isLoading ? (
							<BounceLoader
								className="absolute top-1/2 right-1/2"
								color="green"
								cssOverride={{ position: "sticky" }}
								loading={isLoading}
							/>
						) : (
							<ChartContainer
								config={chartConfig}
								className="mx-auto aspect-square max-h-[400px]"
							>
								<RadarChart data={frequentStepsData}>
									<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
									<PolarGrid />
									<PolarAngleAxis dataKey="step" />
									<Radar name="Steps" dataKey="frequency" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} dot={{
										r: 2,
										fillOpacity: 1,
									}} />
									<Legend />
								</RadarChart>
							</ChartContainer>
						)}
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
};

export default ProfileStepsFrequencyChart;
