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
import { specialSteps, supportedSteps } from "@/configuration";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import { XCircle } from "lucide-react";

const ProfilePatternEditor: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const currentPattern = useColombusStore((state) => state.currentPattern);
	const setCurrentPattern = useColombusStore(
		(state) => state.setCurrentPattern,
	);
	const selectableSteps = !currentPattern?.elements?.length
		? [undefined]
		: [...currentPattern.elements, undefined];
	// TODO: currently only supporting first pattern layer
	const simplifiedPattern = selectableSteps.map((p) =>
		typeof p === "string" ? p : p?.name,
	);
	return (
		<div {...divProps} className={cn("flex", divProps.className)}>
			{currentPattern?.name && (
				<p className="pt-2 px-2 font-bold">{currentPattern.name}: </p>
			)}
			{simplifiedPattern.map((p, i) => (
				<div key={`${i}_${p}`} className="flex items-stretch">
					<Select
						value={`${i}_${p}`}
						onValueChange={(v) => {
							const newStages = [...(currentPattern?.elements ?? [])];
							const [strStageIndex, stageName] = v.split("_");
							const stageIndex = Number.parseInt(strStageIndex);
							if (stageName === "remove") {
								// TODO
								// newStages.splice(stageIndex, 1);
							} else {
								newStages[stageIndex] = stageName;
							}
							setCurrentPattern({ ...currentPattern, elements: newStages });
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select stage..." />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel className="ml-2 text-xs">Stages</SelectLabel>
								{supportedSteps.map((s) => (
									<SelectItem key={`${i}_${s}`} value={`${i}_${s}`}>
										{s}
									</SelectItem>
								))}
							</SelectGroup>
							<SelectGroup>
								<SelectLabel className="ml-2 text-xs">
									Pattern elements
								</SelectLabel>
								{specialSteps.map((s) => (
									<SelectItem
										key={`${i}_${s}`}
										value={`${i}_${s}`}
										className="font-bold"
									>
										{s}
									</SelectItem>
								))}
							</SelectGroup>
							<SelectSeparator />
							<SelectItem value={`${i}_remove`} className="text-center">
								Remove <XCircle />
							</SelectItem>
						</SelectContent>
					</Select>
					{i < selectableSteps.length - 1 && <p>&#8594;</p>}
				</div>
			))}
		</div>
	);
};

export default ProfilePatternEditor;
