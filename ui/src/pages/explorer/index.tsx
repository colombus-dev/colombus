import {
	type Neo4JGraphDefinition,
	getAllProfiles,
	getNodesFromNeo4J,
	postApplyPpmFilter,
	postApplyPpmFilterByName,
	postProfiles,
} from "@/api/client";
import ProfilePattern from "@/components/profile-pattern";
import ProfilePatternActions from "@/components/profile-pattern-actions";
import ProfilePatternList from "@/components/profile-pattern-list";
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
import { specialStages, stepsColorsMapping } from "@/configuration";
import type { PpmNodesDisplayMode } from "@/configuration";
import useGraph from "@/hooks/useGraph";
import useGraphPpm from "@/hooks/useGraphPpm";
import useGraphStyle from "@/hooks/useGraphStyle";
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
	const [displayedLevel, setDisplayedLevel] = useState<number>(2); // default display to step
	const [currentPpmName, setCurrentPpmName] = useState<string | undefined>();
	const [currentPpm, setCurrentPpm] = useState<File | undefined>();
	const [ppmJson, setPpmJson] = useState<string[]>([]); // currently only supporting stages
	const [postedProfiles, setPostedProfiles] = useState<string[] | undefined>();
	const [resultSearchFilter, setResultSearchFilter] = useState<string>("");
	const [isWeightedNodesChecked, setIsWeightedNodesChecked] =
		useState<boolean>(true);
	const [ppmNodesDisplayMode, setPpmNodesDisplayMode] =
		useState<PpmNodesDisplayMode>("show-all");

	const { renderer } = useGraph(
		graphContainerId,
		filteredWorkflowsNodes,
		filteredWorkflows,
		displayedLevel,
		isWeightedNodesChecked,
	);

	useGraphPpm(ppmNodesDisplayMode, renderer.current, allWorkflowsWithPpmData);
	useGraphStyle(renderer.current);

	useEffect(() => {
		if (currentPpm) {
			currentPpm.text().then((r) => {
				setPpmJson(
					(JSON.parse(r) as (string | { name: string })[]).map((sa) =>
						specialStages.includes(sa as string)
							? (sa as string)
							: (sa as { name: string }).name,
					),
				);
			});
		} else {
			setPpmJson([]);
			setCurrentPpmName(undefined);
		}
	}, [currentPpm]);

	useEffect(() => {
		if (!currentPpmName) {
			setPpmJson([]);
		}
	}, [currentPpmName]);

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
		if (currentPpm) {
			postApplyPpmFilter(currentPpm).then((workflowsWithData) =>
				updateAndMergeWithPosted(
					[...new Set(workflowsWithData.map(([n]) => n))].sort(),
					workflowsWithData,
				),
			);
		} else if (currentPpmName) {
			postApplyPpmFilterByName(currentPpmName).then((workflowsWithData) =>
				updateAndMergeWithPosted(
					[...new Set(workflowsWithData.map(([n]) => n))].sort(),
					workflowsWithData,
				),
			);
		} else {
			getAllProfiles().then((wfs) => updateAndMergeWithPosted(wfs, undefined));
		}
	}, [currentPpm, currentPpmName, postedProfiles]);

	const handlePpmFormSubmit: React.FormEventHandler<HTMLFormElement> =
		useCallback(async (e) => {
			e.preventDefault();
			const files = ((e.target as HTMLFormElement)[0] as HTMLInputElement)
				.files;
			if (!files) {
				return;
			}
			setCurrentPpm(files[0]);
		}, []);

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
				{allWorkflows && (
					<div className="space-y-2">
						<p className="font-bold">Displayed levels:</p>
						<Select
							onValueChange={(v) => setDisplayedLevel(Number.parseInt(v))}
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
				)}
				{allWorkflows && (
					<div className="space-y-2">
						<p className="font-bold">Customization:</p>
						<div className="flex space-x-2" key="check-weighted-nodes-div">
							<Checkbox
								id="check-weighted-nodes"
								checked={isWeightedNodesChecked}
								onCheckedChange={(c) => setIsWeightedNodesChecked(!!c)}
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
								value={ppmNodesDisplayMode}
								onValueChange={(v) =>
									setPpmNodesDisplayMode(v as PpmNodesDisplayMode)
								}
								disabled={ppmJson.length === 0}
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
					</div>
				)}
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
				{ppmJson.length === 0 ? (
					<div className="grid grid-cols-8 space-x-2">
						<form
							onSubmit={handlePpmFormSubmit}
							className="row-span-1 col-span-2"
						>
							<div className="grid w-full max-w-sm items-center gap-1.5">
								<Label htmlFor="ppm-form">
									Select a pattern to apply (JSON)
								</Label>
								<Input
									id="ppm-form"
									type="file"
									accept=".json"
									name="ppm-form"
								/>
								<Button type="submit">Submit PPM filter</Button>
							</div>
						</form>
						<Button className="row-span-1 col-span-2">
							Create new pattern
						</Button>
						<ScrollArea className="row-span-1 col-span-2 h-24">
							<p className="font-bold">Saved patterns</p>
							<ProfilePatternList
								onSelectedPatternChange={(n, c) => {
									setPpmJson(c);
									setCurrentPpmName(n);
								}}
							/>
						</ScrollArea>
					</div>
				) : (
					<ScrollArea className="row-span-1 h-full mr-8">
						{(currentPpm || currentPpmName) && (
							<ProfilePatternActions
								patternFile={currentPpm}
								patternName={currentPpmName}
								onSave={(name) => setCurrentPpmName(name)}
								onReset={() => {
									setCurrentPpm(undefined);
									setCurrentPpmName(undefined);
								}}
								onDelete={() => {
									setCurrentPpm(undefined);
									setCurrentPpmName(undefined);
								}}
							/>
						)}
						<ProfilePattern
							patternName={currentPpmName}
							pattern={ppmJson}
							className="overflow-x-auto"
						/>
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
