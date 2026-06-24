import { useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { createNewProject } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PATH } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";

export const ProjectCreateForm: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const jwtToken = useColombusStore((state) => state.jwtToken);
	const navigate = useNavigate();

	const handleCreateProject = useCallback(
		async (formData: FormData) => {
			const newProjectName = formData.get("project-name-form")?.toString();
			if (!jwtToken || !newProjectName) {
				return;
			}
			await createNewProject(newProjectName)
				.then((projectId) => {
					toast.success("Project successfully created.");
					navigate(`${PATH.EXPLORER}/${projectId}`);
				})
				.catch((r) => {
					toast.error(r?.response?.data?.detail || "Failed to create project");
				});
		},
		[jwtToken, navigate],
	);

	return (
		<div
			{...divProps}
			className={cn(
				"bg-white rounded-2xl p-6 shadow-sm border border-slate-200",
				divProps.className,
			)}
		>
			<h2 className="text-xl font-bold text-slate-900">Create project</h2>
			<p className="text-sm text-slate-500 mt-1 mb-6">
				Enter a project name, then create it directly from here.
			</p>
			<form action={handleCreateProject} className="flex gap-4 w-full">
				<Input
					name="project-name-form"
					required
					placeholder="Type a project name"
					className="flex-1 bg-slate-50/50 border-slate-200 rounded-xl h-11"
				/>
				<Button
					type="submit"
					className="rounded-xl px-6 h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium"
				>
					Create project
				</Button>
			</form>
		</div>
	);
};

export default ProjectCreateForm;
