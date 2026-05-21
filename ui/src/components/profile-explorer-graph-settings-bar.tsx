import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { PpmNodesDisplayMode } from "@/configuration";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import ProjectTaxonomyList from "./project-taxonomy-list";

const ProfileExplorerGraphSettingsBar: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const referenceDiffProfile = useColombusStore(
		(state) => state.referenceDiffProfile,
	);
	const currentPattern = useColombusStore((state) => state.currentPattern);
	const setDisplayedLevel = useColombusStore(
		(state) => state.setDisplayedLevel,
	);
	const useWeightedNodes = useColombusStore((state) => state.useWeightedNodes);
	const setUseWeightedNodes = useColombusStore(
		(state) => state.setUseWeightedNodes,
	);
	const patternCapturedNodesDisplayMode = useColombusStore(
		(state) => state.patternCapturedNodesDisplayMode,
	);
	const setPatternCapturedNodesDisplayMode = useColombusStore(
		(state) => state.setPatternCapturedNodesDisplayMode,
	);

	return (
		<div
			{...divProps}
			className={cn(
				"flex flex-col space-y-5 text-sm select-none",
				divProps.className,
			)}
		>
			<div className="space-y-2">
				<h3 className="font-bold text-slate-800">Displayed levels:</h3>
				<Select
					onValueChange={(v) => setDisplayedLevel(Number.parseInt(v, 10))}
					defaultValue="2"
				>
					<SelectTrigger className="w-full bg-white border-slate-200 shadow-sm">
						<SelectValue placeholder="Level to display" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="1">Workflow</SelectItem>
						<SelectItem value="2">Step</SelectItem>
						<SelectItem value="3">MetaInstruction</SelectItem>
						<SelectItem value="4">Code</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<h3 className="font-bold text-slate-800">Customization:</h3>
				<div className="flex flex-col space-y-3.5">
					<div
						className="flex items-center space-x-2"
						key="check-weighted-nodes-div"
					>
						<Checkbox
							id="check-weighted-nodes"
							checked={useWeightedNodes}
							onCheckedChange={(c) => setUseWeightedNodes(!!c)}
						/>
						<Label
							htmlFor="check-weighted-nodes"
							className="text-xs font-semibold text-slate-800 cursor-pointer"
						>
							Use weighted nodes
						</Label>
					</div>
					<div
						className="flex flex-col space-y-2"
						key="radio-ppm-nodes-display-div"
					>
						<RadioGroup
							value={patternCapturedNodesDisplayMode}
							onValueChange={(v: PpmNodesDisplayMode) =>
								setPatternCapturedNodesDisplayMode(v)
							}
							disabled={!referenceDiffProfile && !currentPattern}
							className="flex flex-col space-y-2"
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="show-all" id="show-all" />
								<Label
									htmlFor="show-all"
									className="text-xs font-semibold text-slate-800 cursor-pointer"
								>
									Show all nodes
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="show-fixed" id="show-fixed" />
								<Label
									htmlFor="show-fixed"
									className="text-xs font-semibold text-slate-800 cursor-pointer"
								>
									Show fixed nodes
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="show-variable" id="show-variable" />
								<Label
									htmlFor="show-variable"
									className="text-xs font-semibold text-slate-800 cursor-pointer"
								>
									Show variable nodes
								</Label>
							</div>
						</RadioGroup>
					</div>
				</div>
			</div>
			<ProjectTaxonomyList className="border-t border-slate-100 pt-4" />
		</div>
	);
};

export default ProfileExplorerGraphSettingsBar;
