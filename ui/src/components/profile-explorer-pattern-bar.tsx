import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PatternGroup } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import { useCallback } from "react";

const ProfileExplorerPatternBar: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const setCurrentPattern = useColombusStore(
		(state) => state.setCurrentPattern,
	);

	const handlePpmFormSubmit = useCallback(
		async (formData: FormData) => {
			const file = formData.get("ppm-form") as File | null;
			if (!file) {
				return;
			}
			file.text().then((r) => {
				setCurrentPattern({
					groups: JSON.parse(r) as PatternGroup[],
				});
			});
		},
		[setCurrentPattern],
	);

	return (
		<div className={cn("grid grid-cols-4 space-x-2", divProps.className)}>
			<form action={handlePpmFormSubmit} className="col-span-2">
				<div className="grid w-full max-w-sm items-center gap-1.5">
					<Label htmlFor="ppm-form">Select a pattern to apply (JSON)</Label>
					<Input
						id="ppm-form"
						type="file"
						accept=".json"
						name="ppm-form"
						required
					/>
					<Button type="submit">Submit PPM filter</Button>
				</div>
			</form>
		</div>
	);
};

export default ProfileExplorerPatternBar;
