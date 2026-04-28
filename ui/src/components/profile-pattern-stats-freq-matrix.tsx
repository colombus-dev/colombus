import { useState } from "react";
import { useParams } from "react-router";
import BounceLoader from "react-spinners/BounceLoader";
import { postFrequentPatternsMatrixImage } from "@/api/client";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useColombusStore } from "@/store";
import { Button } from "./ui/button";

const ProfilePatternStatsFreqMatrix: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = () => {
	const { projectId } = useParams<{ projectId: string }>();
	const [frequentPatternsMatrix, setFrequentPatternsMatrix] =
		useState<string>();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const availableProfilesNames = useColombusStore(
		(state) => state.availableProfilesNames,
	);

	if (!projectId) {
		return;
	}

	return (
		<Dialog
			onOpenChange={(isOpen) => {
				if (isOpen) {
					setIsLoading(true);
					postFrequentPatternsMatrixImage(
						projectId,
						availableProfilesNames,
					).then((res) => {
						setFrequentPatternsMatrix(res);
						setIsLoading(false);
					});
				} else {
					setIsLoading(false);
				}
			}}
		>
			<DialogTrigger asChild>
				<Button className="w-full" disabled={availableProfilesNames.length < 2}>
					View Frequent Patterns Matrix
				</Button>
			</DialogTrigger>
			<DialogContent className="min-w-[1200px]">
				<DialogHeader>
					<DialogTitle>Frequent Patterns Matrix (top 30)</DialogTitle>
					<DialogDescription>
						{isLoading ? (
							<BounceLoader
								className="absolute top-1/2 right-1/2"
								color="green"
								cssOverride={{ position: "sticky" }}
								loading={isLoading}
							/>
						) : (
							<img
								width={1200}
								height={600}
								src={`data:image/png;base64,${frequentPatternsMatrix}`}
								alt="Frequent Patterns Matrix"
							/>
						)}
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
};

export default ProfilePatternStatsFreqMatrix;
