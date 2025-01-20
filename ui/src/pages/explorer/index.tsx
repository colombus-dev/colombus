import {
	type Neo4JGraphDefinition,
	getAllProfiles,
	getNodesFromNeo4J,
	postApplyPpmFilter,
	postApplyPpmFilterByName,
	postProfiles,
} from "@/api/client";
import ProfileExplorerGraphSettingsBar from "@/components/profile-explorer-graph-settings-bar";
import ProfileExplorerPatternBar from "@/components/profile-explorer-pattern-bar";
import ProfilePattern from "@/components/profile-pattern";
import ProfilePatternActions from "@/components/profile-pattern-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { stepsColorsMapping } from "@/configuration";
import type { PpmNodesDisplayMode } from "@/configuration";
import useGraph from "@/hooks/useGraph";
import useGraphPpm from "@/hooks/useGraphPpm";
import useGraphStyle from "@/hooks/useGraphStyle";
import { useColombusStore } from "@/store";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

let beforeAllChecked: string[] | undefined = undefined;

export default function ExplorerPage() {
	const [graphContainerId, setGraphContainerId] = useState<
		string | undefined
	>();
	const [filteredWorkflowsNodes, setFilteredWorkflowsNodes] = useState<
		Neo4JGraphDefinition | undefined
	>();
	const [allWorkflows, setAllWorkflows] = useState<string[] | undefined>();
	const [filteredWorkflows, setFilteredWorkflows] = useState<
		string[] | undefined
	>();
	const [allWorkflowsWithPpmData, setAllWorkflowsWithPpmData] = useState<
		string[][] | undefined
	>();
	const [postedProfiles, setPostedProfiles] = useState<string[] | undefined>();
	const [resultSearchFilter, setResultSearchFilter] = useState<string>("");

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

	const { renderer } = useGraph(
		graphContainerId,
		filteredWorkflowsNodes,
		filteredWorkflows,
	);

	useGraphPpm(
		patternCapturedNodesDisplayMode,
		renderer.current,
		allWorkflowsWithPpmData,
	);
	useGraphStyle(renderer.current);

	useEffect(() => {
		const updateAndMergeWithPosted = async (
			workflowsNames: string[],
			workflowsPpmData: string[][] | undefined,
		) => {
			setAllWorkflows(workflowsNames);
			// we prioritize newly posted profiles
			const reducedWorkflows = new Set(
				workflowsNames.filter(([w]) => postedProfiles?.includes(w)),
			).union(new Set(workflowsNames.slice(0, 5)));
			setFilteredWorkflows([...reducedWorkflows]);
			setAllWorkflowsWithPpmData(workflowsPpmData);
			await getNodesFromNeo4J(workflowsNames).then((r) =>
				setFilteredWorkflowsNodes(r),
			);
		};
		if (currentPattern?.elements) {
			postApplyPpmFilter(currentPattern.elements).then((workflowsWithData) =>
				updateAndMergeWithPosted(
					[...new Set(workflowsWithData.map(([n]) => n))].sort(),
					workflowsWithData,
				),
			);
		} else if (currentPattern?.name) {
			postApplyPpmFilterByName(currentPattern.name).then((workflowsWithData) =>
				updateAndMergeWithPosted(
					[...new Set(workflowsWithData.map(([n]) => n))].sort(),
					workflowsWithData,
				),
			);
		} else {
			getAllProfiles().then((wfs) => updateAndMergeWithPosted(wfs, undefined));
		}
	}, [currentPattern, postedProfiles]);

	const handleProfileFormSubmit: React.FormEventHandler<HTMLFormElement> =
		useCallback(async (e) => {
			e.preventDefault();
			const files = ((e.target as HTMLFormElement)[0] as HTMLInputElement)
				.files;
			if (!files) {
				return;
			}
			await postProfiles(files).then((r) => {
				toast("Profile(s) successfuly imported.");
				setPostedProfiles(r);
			});
		}, []);

	useEffect(() => {
		setGraphContainerId("graph-container");
	}, []);

	return (
		<section className="grid grid-cols-6 space-x-4 h-full">
			<div className="col-span-1 space-y-2 p-2">
				<div className="row-span-1">
					<form onSubmit={handleProfileFormSubmit}>
						<div className="grid w-full max-w-sm items-center gap-1.5">
							<Label htmlFor="profile-form">Import a new profile (JSON)</Label>
							<Input
								id="profile-form"
								type="file"
								accept=".json"
								multiple
								name="profile-form"
							/>
							<Button type="submit">Submit Profile</Button>
						</div>
					</form>
				</div>
				{allWorkflows && <ProfileExplorerGraphSettingsBar />}
				{allWorkflows && (
					<div className="space-y-2">
						<p className="font-bold">Results: {allWorkflows.length} matches</p>
						<Input
							id="filter-results"
							type="text"
							placeholder="Filter results"
							onChange={(e) =>
								setResultSearchFilter(e.target.value.toLowerCase())
							}
						/>
						<div className="flex space-x-2" key="check-all-div">
							<Checkbox
								id="check-all"
								checked={filteredWorkflows?.length === allWorkflows.length}
								onCheckedChange={(c) => {
									if (c) {
										beforeAllChecked = filteredWorkflows;
										setFilteredWorkflows(allWorkflows);
									} else {
										setFilteredWorkflows(beforeAllChecked);
									}
								}}
							/>
							<div className="grid gap-1.5 leading-none">
								<label
									htmlFor="check-all"
									className="text-sm font-medium italic"
								>
									Check all
								</label>
							</div>
						</div>
						<ScrollArea className="h-[45vh]">
							<div className="space-y-1">
								{allWorkflows
									.filter((w) => w.toLowerCase().includes(resultSearchFilter))
									.map((w) => (
										<div className="flex space-x-2" key={w}>
											<Checkbox
												id={`cb_${w}`}
												checked={filteredWorkflows?.includes(w)}
												onCheckedChange={(c) => {
													if (!filteredWorkflows) {
														return;
													}
													setFilteredWorkflows(
														c
															? [...filteredWorkflows, w]
															: filteredWorkflows.filter((fw) => fw !== w),
													);
												}}
											/>
											<div className="grid gap-1.5 leading-none">
												<label
													htmlFor={`cb_${w}`}
													className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
												>
													{w}
												</label>
											</div>
										</div>
									))}
							</div>
							<ScrollBar />
						</ScrollArea>
					</div>
				)}
			</div>
			<div className="col-span-5 grid grid-rows-6 items-center">
				{!currentPattern ? (
					<ProfileExplorerPatternBar className="row-span-1s" />
				) : (
					<ScrollArea className="row-span-1 h-full mr-8">
						{currentPattern && <ProfilePatternActions />}
						<ProfilePattern className="overflow-x-auto" />
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
				<div
					className="row-span-7 border-gray-500 border"
					id="graph-container"
					style={{ height: "99%", width: "98%" }}
				/>
				<table className="relative text-sm">
					<thead className="font-bold">
						<tr>
							<td colSpan={2}>Legend</td>
						</tr>
					</thead>
					<tbody>
						{Object.entries(stepsColorsMapping).map(([n, c]) => (
							<tr key={`legend_color_${c}`}>
								<td
									style={{ backgroundColor: c, width: "20px", height: "20px" }}
								/>
								<td>{n}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
