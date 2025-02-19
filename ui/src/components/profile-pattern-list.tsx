import { getAllPatterns } from "@/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import { useEffect } from "react";
import { useParams } from "react-router";

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
					<li key={name}>
						<Button
							className="w-full"
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
