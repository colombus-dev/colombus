import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { specialStages, supportedStages } from "@/configuration";
import { cn } from "@/lib/utils";
import { XCircle } from "lucide-react";

interface ProfilePatternProps {
	patternName?: string;
	pattern?: string[];
	onPatternChanged?: (callback: (prev: string[]) => string[]) => void;
	editable?: boolean;
}

const ProfilePattern: React.FunctionComponent<
	ProfilePatternProps & React.HTMLAttributes<HTMLDivElement>
> = ({
	patternName,
	pattern = [],
	onPatternChanged: onStagesChanged,
	editable = false,
	...divProps
}) => {
	const selectableStages = editable ? [...pattern, undefined] : pattern;
	return (
		<div {...divProps} className={cn("flex", divProps.className)}>
			{patternName && <p className="pt-2 px-2 font-bold">{patternName}: </p>}
			{selectableStages.map((p, i) => (
				<div key={`${i}_${p}`} className="flex items-stretch">
					<Select
						value={`${i}_${p}`}
						onValueChange={(v) =>
							onStagesChanged?.((prev) => {
								const newStages = [...prev];
								const [strStageIndex, stageName] = v.split("_");
								const stageIndex = Number.parseInt(strStageIndex);
								if (stageName === "remove") {
									// TODO
									// newStages.splice(stageIndex, 1);
								} else {
									newStages[stageIndex] = stageName;
								}
								return newStages;
							})
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select stage..." />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel className="ml-2 text-xs">Stages</SelectLabel>
								{supportedStages.map((s) => (
									<SelectItem
										key={`${i}_${s}`}
										value={`${i}_${s}`}
										disabled={!editable}
									>
										{s}
									</SelectItem>
								))}
							</SelectGroup>
							<SelectGroup>
								<SelectLabel className="ml-2 text-xs">
									Pattern elements
								</SelectLabel>
								{specialStages.map((s) => (
									<SelectItem
										key={`${i}_${s}`}
										value={`${i}_${s}`}
										className="font-bold"
										disabled={!editable}
									>
										{s}
									</SelectItem>
								))}
							</SelectGroup>
							<SelectSeparator />
							{editable && (
								<SelectItem
									value={`${i}_remove`}
									className="text-center"
									disabled={!editable}
								>
									Remove <XCircle />
								</SelectItem>
							)}
						</SelectContent>
					</Select>
					{i < selectableStages.length - 1 && <p>&#8594;</p>}
				</div>
			))}
		</div>
	);
};

export default ProfilePattern;
