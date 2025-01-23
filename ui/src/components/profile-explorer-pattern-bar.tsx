import ProfilePatternList from "@/components/profile-pattern-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PatternElement } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import { useCallback } from "react";

const ProfileExplorerPatternBar: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const setCurrentPattern = useColombusStore(
		(state) => state.setCurrentPattern,
	);

	const handlePpmFormSubmit: React.FormEventHandler<HTMLFormElement> =
		useCallback(
			async (e) => {
				e.preventDefault();
				const files = ((e.target as HTMLFormElement)[0] as HTMLInputElement)
					.files;
				if (!files) {
					return;
				}
				files[0].text().then((r) => {
					setCurrentPattern({
						elements: JSON.parse(r) as PatternElement[],
					});
				});
			},
			[setCurrentPattern],
		);

	return (
		<div className={cn("grid grid-cols-8 space-x-2", divProps.className)}>
			<form onSubmit={handlePpmFormSubmit} className="col-span-2">
				<div className="grid w-full max-w-sm items-center gap-1.5">
					<Label htmlFor="ppm-form">Select a pattern to apply (JSON)</Label>
					<Input id="ppm-form" type="file" accept=".json" name="ppm-form" />
					<Button type="submit">Submit PPM filter</Button>
				</div>
			</form>
			<Button
				className="col-span-2"
				onClick={() => setCurrentPattern({ elements: [] })}
			>
				Create new pattern
			</Button>
			<ScrollArea className="col-span-2 h-24">
				<p className="font-bold">Saved patterns</p>
				<ProfilePatternList />
			</ScrollArea>
		</div>
	);
};

export default ProfileExplorerPatternBar;
