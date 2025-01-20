import { getAllPatterns } from "@/api/client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ProfilePatternListProps {
	onSelectedPatternChange: (
		selectedPatternName: string,
		patternContent: string[],
	) => void;
}

const ProfilePatternList: React.FunctionComponent<
	ProfilePatternListProps & React.HTMLAttributes<HTMLDivElement>
> = ({ onSelectedPatternChange, ...divProps }) => {
	const [availablePatternsNames, setAvailablePatternsNames] = useState<
		{ name: string; content: string[] }[]
	>([]);

	useEffect(() => {
		getAllPatterns().then((res) => {
			setAvailablePatternsNames(
				res.map(([name, content]) => ({
					name,
					content: content.map((c) =>
						// TODO: currently only supporting the first layer of ppm
						typeof c === "string" ? c : (c as { name: string }).name,
					),
				})),
			);
		});
	}, []);

	return (
		<div {...divProps} className={cn("space-x-1", divProps.className)}>
			{availablePatternsNames.map(({ name, content }) => (
				<Button
					key={name}
					onClick={() => onSelectedPatternChange(name, content)}
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
