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
import ProfilePatternList from "@/components/profile-pattern-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { stepsColorsMapping } from "@/configuration";
import useGraph from "@/hooks/useGraph";
import useGraphPpm from "@/hooks/useGraphPpm";
import { useColombusStore } from "@/store";
import { CirclePlus } from "lucide-react";
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
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const currentPattern = useColombusStore((state) => state.currentPattern);
	const currentProject = useColombusStore((state) => state.currentProject);
	const setAvailableProfilesWithPpmData = useColombusStore(
		(state) => state.setAvailableProfilesWithPpmData,
	);
	const setAvailableProfilesNames = useColombusStore(
		(state) => state.setAvailableProfilesNames,
	);
	const setFilteredProfilesNames = useColombusStore(
		(state) => state.setFilteredProfilesNames,
	);

	const setCurrentPattern = useColombusStore(
		(state) => state.setCurrentPattern,
	);

	const { renderer } = useGraph(graphContainerId, filteredWorkflowsNodes);

	useGraphPpm(renderer.current);

	useEffect(() => {
		if (!currentProject) {
			return;
		}
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
				currentProject.id,
				workflowsNames.filter(
					(n) => !filteredWorkflowsNodes?.find(({ name }) => name === n),
				),
			).then((r) => {
				setFilteredWorkflowsNodes([...graphNodesToKeep, ...r]);
				setIsLoading(false);
			});
		};
		setIsLoading(true);
		if (currentPattern?.elements.length) {
			postApplyPpmFilter(currentProject.id, currentPattern.elements).then(
				(workflowsWithData) =>
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
			postApplyPpmFilterByName(currentProject.id, currentPattern.name).then(
				(workflowsWithData) =>
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
			getAllProfiles(currentProject.id).then((wfs) =>
				updateAndMergeWithPosted(wfs, undefined),
			);
		}
	}, [
		currentProject,
		currentPattern,
		postedProfiles,
		setFilteredProfilesNames,
		setAvailableProfilesNames,
		setAvailableProfilesWithPpmData,
	]);

	const handleProfileFormSubmit: React.FormEventHandler<HTMLFormElement> =
		useCallback(
			async (e) => {
				e.preventDefault();
				const files = ((e.target as HTMLFormElement)[0] as HTMLInputElement)
					.files;
				if (!files || !currentProject) {
					return;
				}
				await postProfiles(currentProject.id, files).then((r) => {
					toast.success("Profile(s) successfuly imported.");
					setPostedProfiles(r);
				});
			},
			[currentProject],
		);

	useEffect(() => {
		setGraphContainerId("graph-container");
	}, []);

	return (
		<section className="grid grid-cols-7 space-x-4 h-full">
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
			<div className="col-span-4 grid grid-rows-6 items-center">
				{!currentPattern ? (
					<ProfileExplorerPatternBar className="row-span-1s" />
				) : (
					<ScrollArea className="row-span-1 h-full mr-8">
						{currentPattern && <ProfilePatternActions />}
						<ProfilePatternEditor className="overflow-x-auto" />
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
				{isLoading && <p>Loading...</p>}
				<div
					className="row-span-7 border-gray-500 border"
					id="graph-container"
					style={{ height: "99%", width: "98%" }}
				/>
			</div>
			<div className="col-span-1 space-y-4">
				<p className="font-bold">Saved patterns</p>
				<div className="col-span-2">
					<Button
						className="w-full"
						onClick={() => setCurrentPattern({ elements: [] })}
					>
						<CirclePlus />
						Create new pattern
					</Button>
				</div>
				<Separator />
				<ProfilePatternList />
			</div>
			<div className="col-span-1 space-y-4">
				<p className="font-bold">Legend</p>
				<ul className="list-none space-y-1 text-sm">
					{Object.entries(stepsColorsMapping).map(([n, c]) => (
						<li
							key={`legend_color_${c}`}
							className="flex flex-row space-y-1 space-x-1"
						>
							<div
								className="w-2"
								style={{
									backgroundColor: c,
									width: "20px",
									height: "20px",
								}}
							/>
							<div>{n}</div>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
