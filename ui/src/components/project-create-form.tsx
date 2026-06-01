import { useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { createNewProject } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PATH } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";

const ProjectCreateForm: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const apiKey = useColombusStore((state) => state.apiKey);
	const navigate = useNavigate();

	const handleProfileFormSubmit = useCallback(
		async (formData: FormData) => {
			const newProjectName = formData.get("project-name-form")?.toString();
			if (!apiKey || !newProjectName) {
				return;
			}
			await createNewProject(newProjectName)
				.then((projectId) => {
					toast.success("Project successfuly created.");
					navigate(`${PATH.EXPLORER}/${projectId}`);
				})
				.catch((r) => {
					toast.error(r.response.data.detail);
				});
		},
		[apiKey, navigate],
	);

	return (
		<div {...divProps} className={cn("space-x-1", divProps.className)}>
			<form action={handleProfileFormSubmit}>
				<div className="grid w-full max-w-sm items-center gap-1.5">
					<Label htmlFor="project-form">Create a new project</Label>
					<Input
						id="project-form"
						name="project-name-form"
						required
						placeholder="Enter project name"
					/>
					<Button type="submit">Create project</Button>
				</div>
			</form>
		</div>
	);
};

export default ProjectCreateForm;
