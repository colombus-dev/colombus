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

interface ProfilePatternActionsProps {
	patternName?: string;
	patternFile?: File;
	onReset?: () => void;
	onDelete?: () => void;
	onSave?: (name: string) => void;
}

const ProfilePatternActions: React.FunctionComponent<
	ProfilePatternActionsProps & React.HTMLAttributes<HTMLDivElement>
> = ({ patternName, patternFile, onReset, onDelete, onSave, ...divProps }) => {
	const [savePatternName, setSavePatternName] = useState<string>();
	return (
		<div {...divProps} className={cn("flex", divProps.className)}>
			<Button
				variant="ghost"
				onClick={() => {
					onReset?.();
				}}
			>
				<CircleX /> Reset pattern
			</Button>
			<Button
				variant="ghost"
				onClick={() => {
					if (patternName) {
						deletePpm(patternName).then(onDelete);
					}
				}}
				disabled={patternName === undefined}
			>
				<Trash /> Delete pattern
			</Button>
			<Dialog>
				<DialogTrigger disabled={!patternFile} asChild>
					<Button variant="ghost" disabled={patternName !== undefined}>
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
									if (savePatternName && patternFile) {
										postSavePpm(savePatternName, patternFile).then(onSave);
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
