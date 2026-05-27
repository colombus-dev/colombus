import { Save, RotateCcw } from "lucide-react";
import { useParams } from "react-router";
import { getAllPatterns, postSavePpm } from "@/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";

const ProfilePatternActions: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const currentPattern = useColombusStore((state) => state.currentPattern);
	const resetCurrentPattern = useColombusStore(
		(state) => state.resetCurrentPattern,
	);
	const setAvailablePatterns = useColombusStore(
		(state) => state.setAllSavedPatterns,
	);

	const { projectId } = useParams<{ projectId: string }>();

	return (
		<div {...divProps} className={cn("flex", divProps.className)}>
			<Button
				variant="ghost"
				onClick={resetCurrentPattern}
				disabled={currentPattern === undefined}
			>
				<RotateCcw /> Reset pattern
			</Button>
			<Button
				variant="ghost"
				onClick={() => {
					if (currentPattern?.groups && projectId) {
						postSavePpm(projectId, currentPattern).then(() => {
							getAllPatterns(projectId).then(setAvailablePatterns);
						});
					}
				}}
				disabled={!(currentPattern?.groups && projectId)}
			>
				<Save /> Save pattern
			</Button>
		</div>
	);
};

export default ProfilePatternActions;
