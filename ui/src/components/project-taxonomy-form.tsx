import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ProjectTaxonomyForm: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {

	const handleProfileFormSubmit = useCallback(
		async (_formData: FormData) => {
			// TODO
		},
		[],
	);

	return (
		<div {...divProps}>
			<form action={handleProfileFormSubmit}>
				<div className="grid w-full max-w-sm items-center gap-1.5">
					<Label htmlFor="profile-form">
						Change the taxonomy
					</Label>
					<Input
						id="taxonomy-form"
						name="taxonomy-form"
						type="file"
						accept=".json"
						required
					/>
					<Button type="submit">Submit Taxonomy (list of strings)</Button>
				</div>
			</form>
		</div>
	);
};

export default ProjectTaxonomyForm;
