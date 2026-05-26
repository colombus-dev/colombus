import { Save, Trash } from "lucide-react";
import { useParams } from "react-router";
import { getAllPatterns, postSavePpm } from "@/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import DeletePatternDialog from "./delete-pattern-dialog";

const ProfilePatternActions: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const currentPattern = useColombusStore((state) => state.currentPattern);
	const setAvailablePatterns = useColombusStore(
		(state) => state.setAllSavedPatterns,
	);

	const { projectId } = useParams<{ projectId: string }>();

	return (
		<div {...divProps} className={cn("flex", divProps.className)}>
			<DeletePatternDialog patternName={currentPattern?.name}>
				<Button variant="ghost" disabled={currentPattern?.name === undefined}>
					<Trash /> Delete pattern
				</Button>
			</DeletePatternDialog>
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
