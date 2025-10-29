import { deletePpm } from "@/api/client";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useColombusStore } from "@/store";
import { useParams } from "react-router";

interface DeletePatternDialogProps {
	patternName?: string;
}

export default function DeletePatternDialog({
	patternName,
	children,
}: React.PropsWithChildren<DeletePatternDialogProps>) {
	const resetCurrentPattern = useColombusStore(
		(state) => state.resetCurrentPattern,
	);
	const { projectId } = useParams<{ projectId: string }>();
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete the
						pattern: <p className="font-bold">{patternName}</p>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							if (projectId && patternName) {
								deletePpm(projectId, patternName).then(resetCurrentPattern);
							}
						}}
					>
						Continue
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
