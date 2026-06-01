import ProjectTaxonomyList from "@/components/project-taxonomy-list";
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
						<div key="radio-ppm-nodes-display-div">
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
										className="cursor-pointer font-medium text-slate-800"
									>
										Show all nodes
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="show-fixed" id="show-fixed" />
									<Label
										htmlFor="show-fixed"
										className="cursor-pointer font-medium text-slate-800"
									>
										Show fixed nodes
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="show-variable" id="show-variable" />
									<Label
										htmlFor="show-variable"
										className="cursor-pointer font-medium text-slate-800"
									>
										Show variable nodes
									</Label>
								</div>
							</RadioGroup>
						</div>
					</div>
				</div>
			</div>
			<ProjectTaxonomyList className="flex-1 min-h-0 mt-1" />
		</div>
	);
};

export default ProfileExplorerGraphSettingsBar;
