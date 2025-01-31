import {
	getAllProfiles,
	getGraphNodes,
	postApplyPpmFilter,
	postApplyPpmFilterByName,
	postProfiles,
} from "@/api/client";
import type { GraphDefinition, PpmResult } from "@/api/client";
import ProfileExplorerGraphSettingsBar from "@/components/profile-explorer-graph-settings-bar";
import ProfileExplorerPatternBar from "@/components/profile-explorer-pattern-bar";
import ProfileExplorerPpmResultsBar from "@/components/profile-explorer-ppm-results-bar";
import ProfilePatternActions from "@/components/profile-pattern-actions";
import ProfilePatternEditor from "@/components/profile-pattern-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { stepsColorsMapping } from "@/configuration";
import useGraph from "@/hooks/useGraph";
import useGraphPpm from "@/hooks/useGraphPpm";
import { useColombusStore } from "@/store";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ExplorerPage() {
	const [graphContainerId, setGraphContainerId] = useState<
		string | undefined
	>();
	const [filteredWorkflowsNodes, setFilteredWorkflowsNodes] = useState<
		GraphDefinition[] | undefined
	>();
	const [postedProfiles, setPostedProfiles] = useState<string[] | undefined>();
	const currentPattern = useColombusStore((state) => state.currentPattern);
	const setAvailableProfilesWithPpmData = useColombusStore(
		(state) => state.setAvailableProfilesWithPpmData,
	);
	const setAvailableProfilesNames = useColombusStore(
		(state) => state.setAvailableProfilesNames,
	);
	const setFilteredProfilesNames = useColombusStore(
		(state) => state.setFilteredProfilesNames,
	);

	const { renderer } = useGraph(graphContainerId, filteredWorkflowsNodes);

	useGraphPpm(renderer.current);

	useEffect(() => {
		const updateAndMergeWithPosted = async (
			workflowsNames: string[],
			workflowsPpmData?: PpmResult[],
		) => {
			setAvailableProfilesNames(workflowsNames);
			// we prioritize newly posted profiles
			const reducedWorkflows = new Set(
				workflowsNames.filter(([w]) => postedProfiles?.includes(w)),
			).union(new Set(workflowsNames.slice(0, 5)));
			setFilteredProfilesNames([...reducedWorkflows]);
			setAvailableProfilesWithPpmData(workflowsPpmData ?? []);
			// TODO: to improve
			const graphNodesToKeep =
				filteredWorkflowsNodes?.filter(({ name }) =>
					workflowsNames.includes(name),
				) ?? [];
			await getGraphNodes(
				workflowsNames.filter(
					(n) => !filteredWorkflowsNodes?.find(({ name }) => name === n),
				),
			).then((r) => setFilteredWorkflowsNodes([...graphNodesToKeep, ...r]));
		};
		if (currentPattern?.elements.length) {
			postApplyPpmFilter(currentPattern.elements).then((workflowsWithData) =>
				updateAndMergeWithPosted(
					[
						...new Set(
							workflowsWithData.map(({ profile_name }) => profile_name),
						),
					],
					workflowsWithData,
				),
			);
		} else if (currentPattern?.name) {
			postApplyPpmFilterByName(currentPattern.name).then((workflowsWithData) =>
				updateAndMergeWithPosted(
					[
						...new Set(
							workflowsWithData.map(({ profile_name }) => profile_name),
						),
					],
					workflowsWithData,
				),
			);
		} else {
			getAllProfiles().then((wfs) => updateAndMergeWithPosted(wfs, undefined));
		}
	}, [
		currentPattern,
		postedProfiles,
		setFilteredProfilesNames,
		setAvailableProfilesNames,
		setAvailableProfilesWithPpmData,
	]);

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
				<ProfileExplorerGraphSettingsBar />
				<ProfileExplorerPpmResultsBar />
			</div>
			<div className="col-span-5 grid grid-rows-6 items-center">
				{!currentPattern ? (
					<ProfileExplorerPatternBar className="row-span-1s" />
				) : (
					<ScrollArea className="row-span-1 h-full mr-8">
						{currentPattern && <ProfilePatternActions />}
						<ProfilePatternEditor className="overflow-x-auto" />
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
