import { getAllPatterns } from "@/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import { useEffect } from "react";

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

	useEffect(() => {
		getAllPatterns().then((res) => {
			setAvailablePatterns(
				res.map(([name, elements]) => ({
					name,
					elements,
				})),
			);
		});
	}, [setAvailablePatterns]);

	return (
		<div {...divProps} className={cn("space-x-1", divProps.className)}>
			{availablePatterns.map(({ name, elements }) => (
				<Button
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
			))}
			{availablePatterns.length === 0 && (
				<p>Saved patterns will be listed here...</p>
			)}
		</div>
	);
};

export default ProfilePatternList;
