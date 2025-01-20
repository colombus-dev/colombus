import { getAllPatterns } from "@/api/client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import type { PatternElement } from "@/lib/types";

interface ProfilePatternListProps {
	onSelectedPatternChange: (
		selectedPatternName: string,
		patternContent: string[],
	) => void;
}

const ProfilePatternList: React.FunctionComponent<
	ProfilePatternListProps & React.HTMLAttributes<HTMLDivElement>
> = ({ onSelectedPatternChange, ...divProps }) => {
	const setCurrentPattern = useColombusStore(
		(state) => state.setCurrentPattern,
	);
	const [availablePatternsNames, setAvailablePatternsNames] = useState<
		{ name: string; elements: PatternElement[] }[]
	>([]);

	useEffect(() => {
		getAllPatterns().then((res) => {
			setAvailablePatternsNames(
				res.map(([name, elements]) => ({
					name,
					elements,
				})),
			);
		});
	}, []);

	return (
		<div {...divProps} className={cn("space-x-1", divProps.className)}>
			{availablePatternsNames.map(({ name, elements }) => (
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
			{availablePatternsNames.length === 0 && (
				<p>Saved patterns will be listed here...</p>
			)}
		</div>
	);
};

export default ProfilePatternList;
