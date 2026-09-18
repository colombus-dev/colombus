import ProjectTaxonomyList from "@/components/project-taxonomy-list";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useColombusStore } from "@/store";

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
			className={`flex flex-col h-full overflow-hidden space-y-4 ${divProps.className ?? ""}`}
		>
			<div className="space-y-4 shrink-0">
				<div className="space-y-2">
					<p className="font-bold">Displayed levels:</p>
					<Select
						onValueChange={(v) => setDisplayedLevel(Number.parseInt(v, 10))}
						defaultValue="2"
					>
						<SelectTrigger>
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
					<p className="font-bold">Customization:</p>
					<div className="flex flex-col space-y-2.5">
						<div
							className="flex items-center space-x-2"
							key="check-weighted-nodes-div"
						>
							<Checkbox
								id="check-weighted-nodes"
								checked={useWeightedNodes}
								onCheckedChange={(c) => setUseWeightedNodes(!!c)}
							/>
							<label
								htmlFor="check-weighted-nodes"
								className="text-sm font-medium leading-none cursor-pointer"
							>
								Use weighted nodes
							</label>
						</div>
						<RadioGroup
							key="radio-ppm-nodes-display-div"
							value={patternCapturedNodesDisplayMode}
							onValueChange={(value) =>
								setPatternCapturedNodesDisplayMode(value as any)
							}
							disabled={!referenceDiffProfile && !currentPattern}
							className="flex flex-col space-y-1 pt-2"
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="show-all" id="show-all" />
								<label
									htmlFor="show-all"
									className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Show all nodes
								</label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="show-fixed" id="show-fixed" />
								<label
									htmlFor="show-fixed"
									className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Show fixed nodes
								</label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="show-variable" id="show-variable" />
								<label
									htmlFor="show-variable"
									className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Show variable nodes
								</label>
							</div>
						</RadioGroup>
					</div>
				</div>
			</div>
			<ProjectTaxonomyList className="flex-1 min-h-0 mt-1" />
		</div>
	);
};

export default ProfileExplorerGraphSettingsBar;
