import { Play, Save, RotateCcw, Loader2 } from "lucide-react";
import { useParams } from "react-router";
import { getAllPatterns, postSavePpm } from "@/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";

export interface ProfilePatternActionsProps extends React.HTMLAttributes<HTMLDivElement> {
	onExecute?: () => void;
	isExecuting?: boolean;
}

const ProfilePatternActions: React.FunctionComponent<ProfilePatternActionsProps> = ({ onExecute, isExecuting, ...divProps }) => {
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
				onClick={onExecute}
				disabled={!projectId || isExecuting}
			>
				{isExecuting ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<Play className="mr-2 h-4 w-4" />
				)}{" "}
				Execute pattern
			</Button>
			<Button
				variant="ghost"
				onClick={resetCurrentPattern}
				disabled={currentPattern === undefined}
			>
				<RotateCcw className="mr-2 h-4 w-4" /> Reset pattern
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
				<Save className="mr-2 h-4 w-4" /> Save pattern
			</Button>
		</div>
	);
};

export default ProfilePatternActions;
