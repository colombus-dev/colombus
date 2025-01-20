import { cn } from "@/lib/utils";
import { CircleX, Save, Trash } from "lucide-react";
import { Button } from "./ui/button";
import { deletePpm, postSavePpm } from "@/api/client";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useColombusStore } from "@/store";

const ProfilePatternActions: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const currentPattern = useColombusStore((state) => state.currentPattern);
	const setCurrentPattern = useColombusStore(
		(state) => state.setCurrentPattern,
	);
	const resetCurrentPattern = useColombusStore(
		(state) => state.resetCurrentPattern,
	);
	const [savePatternName, setSavePatternName] = useState<string>();

	return (
		<div {...divProps} className={cn("flex", divProps.className)}>
			<Button
				variant="ghost"
				onClick={() => {
					resetCurrentPattern();
				}}
			>
				<CircleX /> Reset pattern
			</Button>
			<Button
				variant="ghost"
				onClick={() => {
					if (currentPattern?.name) {
						deletePpm(currentPattern.name).then(resetCurrentPattern);
					}
				}}
				disabled={currentPattern?.name === undefined}
			>
				<Trash /> Delete pattern
			</Button>
			<Dialog>
				<DialogTrigger disabled={!currentPattern?.elements} asChild>
					<Button variant="ghost" disabled={currentPattern?.name !== undefined}>
						<Save /> Save pattern
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Choose a name for the pattern to save</DialogTitle>
					</DialogHeader>
					<Input
						id="name"
						onChange={(e) => {
							setSavePatternName(e.target.value);
						}}
					/>
					<DialogFooter>
						<DialogClose asChild>
							<Button
								type="submit"
								onClick={() => {
									if (savePatternName && currentPattern?.elements) {
										postSavePpm(savePatternName, currentPattern.elements).then(
											(name) =>
												setCurrentPattern({
													...currentPattern,
													name,
												}),
										);
										setSavePatternName(undefined);
									}
								}}
								disabled={!savePatternName}
							>
								Save changes
							</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ProfilePatternActions;
