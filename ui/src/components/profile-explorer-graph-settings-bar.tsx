import ProjectTaxonomyList from "@/components/project-taxonomy-list";
import { SectionHeading } from "@/components/section-heading";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";

const DISPLAYED_LEVEL_ITEMS = [
	{ value: "1", label: "Workflow" },
	{ value: "2", label: "Step" },
	{ value: "3", label: "MetaInstruction" },
	{ value: "4", label: "Code" },
];

const ProfileExplorerGraphSettingsBar: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const currentPattern = useColombusStore((state) => state.currentPattern);
	const displayedLevel = useColombusStore((state) => state.displayedLevel);
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
			className={cn("flex flex-col gap-4 overflow-y-auto", divProps.className)}
		>
			<div className="space-y-4">
				<div className="space-y-2">
					<SectionHeading title="Displayed level" />
					<Select
						onValueChange={(v) =>
							setDisplayedLevel(Number.parseInt(v ?? "2", 10))
						}
						value={String(displayedLevel)}
						items={DISPLAYED_LEVEL_ITEMS}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Level to display" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Level to display</SelectLabel>
								{DISPLAYED_LEVEL_ITEMS.map((item) => (
									<SelectItem key={item.value} value={item.value}>
										{item.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<SectionHeading title="Display options" />
					<div className="flex flex-col space-y-2.5">
						<div
							className="flex items-center gap-3"
							key="check-weighted-nodes-div"
						>
							<Checkbox
								id="check-weighted-nodes"
								checked={useWeightedNodes}
								onCheckedChange={(c) => setUseWeightedNodes(!!c)}
							/>
							<Label htmlFor="check-weighted-nodes">Use weighted nodes</Label>
						</div>
						<RadioGroup
							key="radio-ppm-nodes-display-div"
							value={patternCapturedNodesDisplayMode}
							onValueChange={(value) =>
								setPatternCapturedNodesDisplayMode(value)
							}
							disabled={currentPattern === undefined}
							className="w-fit"
						>
							<div className="flex items-center gap-3">
								<RadioGroupItem value="show-all" id="show-all" />
								<Label htmlFor="show-all">Show all nodes</Label>
							</div>
							<div className="flex items-center gap-3">
								<RadioGroupItem value="show-fixed" id="show-fixed" />
								<Label htmlFor="show-fixed">Show fixed nodes</Label>
							</div>
							<div className="flex items-center gap-3">
								<RadioGroupItem value="show-variable" id="show-variable" />
								<Label htmlFor="show-variable">Show variable nodes</Label>
							</div>
						</RadioGroup>
					</div>
				</div>
			</div>
			<ProjectTaxonomyList />
		</div>
	);
};

export default ProfileExplorerGraphSettingsBar;
