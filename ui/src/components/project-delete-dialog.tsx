import { useState } from "react";
import { toast } from "sonner";
import type { Project } from "@/api/client";
import { deleteProject, getApiErrorMessage } from "@/api/client";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectDeleteDialogProps {
	project: Project;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDeleted: (projectId: string) => void;
}

export const ProjectDeleteDialog = ({
	project,
	open,
	onOpenChange,
	onDeleted,
}: ProjectDeleteDialogProps) => {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleOpenChange = (nextOpen: boolean) => {
		if (isDeleting) {
			return;
		}
		onOpenChange(nextOpen);
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteProject(project.id);
			toast.success(`Project "${project.name}" deleted.`);
			onOpenChange(false);
			onDeleted(project.id);
		} catch (err) {
			toast.error(getApiErrorMessage(err, "Failed to delete project."));
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={handleOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete project?</AlertDialogTitle>
					<AlertDialogDescription>
						<span className="font-medium text-foreground">{project.name}</span>{" "}
						and all its profiles and saved patterns will be permanently deleted.
						This cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={isDeleting}
						onClick={handleDelete}
					>
						{isDeleting ? "Deleting..." : "Delete project"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
