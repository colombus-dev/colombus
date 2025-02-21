import { getAllPatterns } from "@/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import { Trash } from "lucide-react";
import { useEffect } from "react";
import { useParams } from "react-router";
import DeletePatternDialog from "./delete-pattern-dialog";

const ProfilePatternList: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const setCurrentPattern = useColombusStore(
		(state) => state.setCurrentPattern,
	);
	const availablePatterns = useColombusStore((state) => state.allSavedPatterns);
	const setAvailablePatterns = useColombusStore(
		(state) => state.setAllSavedPatterns,
	);
	const { projectId } = useParams<{ projectId: string }>();

	useEffect(() => {
		if (!projectId) {
			return;
		}
		getAllPatterns(projectId).then((res) => {
			setAvailablePatterns(
				res.map(([name, elements]) => ({
					name,
					elements,
				})),
			);
		});
	}, [setAvailablePatterns, projectId]);

	return (
		<div {...divProps} className={cn("space-x-1", divProps.className)}>
			<ul className="list-none space-y-1">
				{availablePatterns.map(({ name, elements }) => (
					<li key={name} className="grid grid-cols-6 space-x-1">
						<Button
							className="col-span-5"
							key={name}
							onClick={() => {
								setCurrentPattern({
									name,
									elements,
								});
							}}
						>
							{name}
						</Button>
						<DeletePatternDialog patternName={name}>
							<Button key={`delete-${name}`} className="col-span-1">
								<Trash />
							</Button>
						</DeletePatternDialog>
					</li>
				))}
				{availablePatterns.length === 0 && (
					<p>Saved patterns will be listed here...</p>
				)}
			</ul>
		</div>
	);
};

export default ProfilePatternList;
