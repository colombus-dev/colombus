import { useState } from "react";
import { useParams } from "react-router";
import BounceLoader from "react-spinners/BounceLoader";
import { postFrequentPatternsMatrixImage } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useColombusStore } from "@/store";

const ProfilePatternStatsFreqMatrix: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = () => {
	const { projectId } = useParams<{ projectId: string }>();
	const [frequentPatternsMatrix, setFrequentPatternsMatrix] = useState<string>();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const availableProfilesNames = useColombusStore(
		(state) => state.availableProfilesNames,
	);

	if (!projectId) {
		return null;
	}

	return (
		<Dialog
			onOpenChange={(isOpen) => {
				if (isOpen) {
					setIsLoading(true);
					postFrequentPatternsMatrixImage(projectId, availableProfilesNames).then(
						(res) => {
							setFrequentPatternsMatrix(res);
							setIsLoading(false);
						},
					);
				} else {
					setIsLoading(false);
				}
			}}
		>
			<DialogTrigger asChild>
				<Button variant="outline">Pattern matrix</Button>
			</DialogTrigger>
			<DialogContent className="min-w-[1200px]">
				<DialogHeader>
					<DialogTitle>Patterns matrix</DialogTitle>
					<DialogDescription>
						{isLoading ? (
							<BounceLoader
								className="absolute top-1/2 right-1/2"
								color="green"
								cssOverride={{ position: "sticky" }}
								loading={isLoading}
							/>
						) : frequentPatternsMatrix ? (
							<img
								src={`data:image/png;base64,${frequentPatternsMatrix}`}
								alt="Frequent patterns matrix"
								className="max-h-[70vh] w-full object-contain"
							/>
						) : null}
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);

};

export default ProfilePatternStatsFreqMatrix;
