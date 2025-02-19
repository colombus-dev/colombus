import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useNavigate } from "react-router";
import { useColombusStore } from "@/store";

const ProjectSearchForm: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const apiKey = useColombusStore((state) => state.apiKey);
	const navigate = useNavigate();

	const handleProfileFormSubmit: React.FormEventHandler<HTMLFormElement> =
		useCallback(
			async (e) => {
				e.preventDefault();
				if (!apiKey) {
					return;
				}
				navigate(
					`/explorer/${((e.target as HTMLFormElement)[0] as HTMLInputElement).value}`,
				);
			},
			[apiKey, navigate],
		);

	return (
		<div {...divProps} className={cn("space-x-1", divProps.className)}>
			<form onSubmit={handleProfileFormSubmit}>
				<div className="grid w-full max-w-sm items-center gap-1.5">
					<Label htmlFor="project-form">Load an existing project</Label>
					<Input
						id="project-form"
						name="project-name-form"
						required
						placeholder="Enter project id"
					/>
					<Button type="submit">Load project</Button>
				</div>
			</form>
		</div>
	);
};

export default ProjectSearchForm;
