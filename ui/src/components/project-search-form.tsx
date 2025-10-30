import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import { useCallback } from "react";
import { useNavigate } from "react-router";

const ProjectSearchForm: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const apiKey = useColombusStore((state) => state.apiKey);
	const navigate = useNavigate();

	const handleProfileFormSubmit = useCallback(
		async (formData: FormData) => {
			const projectId = formData.get("project-name-form");
			if (!apiKey || !projectId) {
				return;
			}
			navigate(`/explorer/${projectId}`);
		},
		[apiKey, navigate],
	);

	return (
		<div {...divProps} className={cn("space-x-1", divProps.className)}>
			<form action={handleProfileFormSubmit}>
				<div className="grid w-full max-w-sm items-center gap-1.5">
					<Label htmlFor="project-form">Load an existing project</Label>
					<Input
						id="project-form"
						name="project-name-form"
						placeholder="Enter project id"
						required
					/>
					<Button type="submit">Load project</Button>
				</div>
			</form>
		</div>
	);
};

export default ProjectSearchForm;
