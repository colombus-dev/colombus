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
import ProjectTaxonomyList from "./project-taxonomy-list";
import { useColombusStore } from "@/store";

const ProfileExplorerGraphSettingsBar: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
	& { stepNames?: string[] }
> = ({ stepNames, ...divProps }) => {
	const displayedLevel = useColombusStore((state) => state.displayedLevel);
	const setDisplayedLevel = useColombusStore((state) => state.setDisplayedLevel);
	const referenceDiffProfile = useColombusStore(
		(state) => state.referenceDiffProfile,
	);
	const currentPattern = useColombusStore((state) => state.currentPattern);
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
		<div {...divProps}>
			<div className="space-y-2">
				<p className="font-bold">Displayed levels:</p>
				<Select
					value={String(displayedLevel)}
					onValueChange={(value) => setDisplayedLevel(Number(value))}
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
				<div className="flex space-x-2" key="check-weighted-nodes-div">
					<Checkbox
						id="check-weighted-nodes"
						checked={useWeightedNodes}
						onCheckedChange={(c) => setUseWeightedNodes(!!c)}
					/>
					<div className="grid gap-1.5 leading-none">
						<label
							htmlFor="check-weighted-nodes"
							className="text-sm font-medium"
						>
							Use weighted nodes
						</label>
					</div>
				</div>
				<div className="flex space-x-2" key="radio-ppm-nodes-display-div">
					<RadioGroup
						value={patternCapturedNodesDisplayMode}
						onValueChange={(v: PpmNodesDisplayMode) =>
							setPatternCapturedNodesDisplayMode(v)
						}
						disabled={!referenceDiffProfile && !currentPattern}
					>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="show-all" id="show-all" />
							<Label htmlFor="show-all">Show all nodes</Label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="show-fixed" id="show-fixed" />
							<Label htmlFor="show-fixed">Show fixed nodes</Label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="show-variable" id="show-variable" />
							<Label htmlFor="show-variable">Show variable nodes</Label>
						</div>
					</RadioGroup>
				</div>
				<ProjectTaxonomyList
					className="rounded-2xl border border-slate-200 bg-white p-3"
					stepNames={stepNames}
				/>
			</div>
		</div>
	);
};

export default ProfileExplorerGraphSettingsBar;
