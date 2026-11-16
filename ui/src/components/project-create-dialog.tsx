import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Project } from "@/api/client";
import { createNewProject } from "@/api/client";
import { ProjectNameDialog } from "@/components/project-name-dialog";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";

interface ProjectCreateDialogProps {
	onCreated: (project: Project) => void;
}

export const ProjectCreateDialog = ({
	onCreated,
}: ProjectCreateDialogProps) => {
	const [open, setOpen] = useState(false);

	const handleSubmit = async (name: string) => {
		const id = await createNewProject(name);
		toast.success(`Project "${name}" created.`);
		onCreated({ id, name });
	};

	return (
		<ProjectNameDialog
			open={open}
			onOpenChange={setOpen}
			title="New project"
			description="Name your new project."
			submitLabel="Create project"
			pendingLabel="Creating..."
			onSubmit={handleSubmit}
			trigger={
				<DialogTrigger render={<Button />}>
					<Plus />
					New project
				</DialogTrigger>
			}
		/>
	);
};
