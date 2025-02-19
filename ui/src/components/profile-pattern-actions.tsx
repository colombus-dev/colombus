import { deletePpm, getAllPatterns, postSavePpm } from "@/api/client";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import { CircleX, Download, Save, Trash } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";

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
	const setAvailablePatterns = useColombusStore(
		(state) => state.setAllSavedPatterns,
	);
	const [savePatternName, setSavePatternName] = useState<string>(
		currentPattern?.name ?? "",
	);

	const { projectId } = useParams<{ projectId: string }>();

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
					if (currentPattern?.name && projectId) {
						deletePpm(projectId, currentPattern.name).then(resetCurrentPattern);
					}
				}}
				disabled={currentPattern?.name === undefined}
			>
				<Trash /> Delete pattern
			</Button>
			<Dialog>
				<DialogTrigger disabled={!currentPattern?.elements} asChild>
					<Button variant="ghost">
						<Save /> Save pattern
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Choose a name for the pattern to save</DialogTitle>
					</DialogHeader>
					<Input
						id="name"
						value={savePatternName}
						onChange={(e) => {
							setSavePatternName(e.target.value);
						}}
					/>
					<DialogFooter>
						<div className="space-x-2">
							<a
								href={`data:text/json;charset=utf-8,${encodeURIComponent(
									JSON.stringify(currentPattern?.elements),
								)}`}
								download={`${savePatternName === "" ? "pattern" : savePatternName}.json`}
								className={cn(buttonVariants({ variant: "link" }))}
							>
								Download Json
								<Download />
							</a>
						</div>
						<DialogClose asChild>
							<Button
								type="submit"
								onClick={() => {
									if (
										savePatternName &&
										currentPattern?.elements &&
										projectId
									) {
										postSavePpm(
											projectId,
											savePatternName,
											currentPattern.elements,
										).then((name) => {
											setCurrentPattern({
												...currentPattern,
												name,
											});
											getAllPatterns(projectId).then((res) => {
												setAvailablePatterns(
													res.map(([name, elements]) => ({
														name,
														elements,
													})),
												);
											});
										});
										setSavePatternName("");
									}
								}}
								disabled={savePatternName === ""}
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
