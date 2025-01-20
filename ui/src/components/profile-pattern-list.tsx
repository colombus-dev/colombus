import { getAllPatterns } from "@/api/client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import type { PatternElement } from "@/lib/types";

const ProfilePatternList: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
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
