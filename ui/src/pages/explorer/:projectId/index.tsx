import {
	getAllProfiles,
	getGraphNodes,
	postApplyPpmFilter,
	postApplyPpmFilterByName,
	postProfiles,
} from "@/api/client";
import type { GraphDefinition, PpmResult } from "@/api/client";
import GraphControls from "@/components/graph-controls";
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
import useValidProject from "@/hooks/useValidProject";
import { useColombusStore } from "@/store";
import { CirclePlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { BounceLoader } from "react-spinners";

const GRAPH_CONTAINER_ID = "graph-container";

export default function ExplorerProjectIdPage() {
	const [graphContainerId, setGraphContainerId] = useState<
		string | undefined
	>();
	const [filteredWorkflowsNodes, setFilteredWorkflowsNodes] = useState<
		GraphDefinition[] | undefined
	>();
	const [postedProfiles, setPostedProfiles] = useState<string[] | undefined>();
	const [isLoading, setIsLoading] = useState<boolean>(false);
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

	const setCurrentPattern = useColombusStore(
		(state) => state.setCurrentPattern,
	);

	const { validity: projectValidity, projectId } = useValidProject();

	const { renderer } = useGraph(graphContainerId, filteredWorkflowsNodes);

	useGraphPpm(renderer.current);

	const navigate = useNavigate();

	useEffect(() => {
		if (projectValidity === "invalid") {
			toast.error("Project not found.");
			navigate("/explorer");
		}
	}, [projectValidity, navigate]);

	useEffect(() => {
		if (!projectId || projectValidity !== "valid") {
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
			).union(new Set(workflowsNames.slice(0, 20)));
			setFilteredProfilesNames([...reducedWorkflows]);
			setAvailableProfilesWithPpmData(workflowsPpmData ?? []);
			// TODO: to improve
			const graphNodesToKeep =
				filteredWorkflowsNodes?.filter(({ name }) =>
					workflowsNames.includes(name),
				) ?? [];
			await getGraphNodes(
				projectId,
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
			postApplyPpmFilter(projectId, currentPattern.elements).then(
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
			postApplyPpmFilterByName(projectId, currentPattern.name).then(
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
			getAllProfiles(projectId).then((wfs) =>
				updateAndMergeWithPosted(wfs, undefined),
			);
		}
	}, [
		projectId,
		projectValidity,
		currentPattern,
		postedProfiles,
		setFilteredProfilesNames,
		setAvailableProfilesNames,
		setAvailableProfilesWithPpmData,
	]);

	useEffect(() => {
		if (isLoading) {
			setFilteredWorkflowsNodes([]);
		}
	}, [isLoading]);

	const handleProfileFormSubmit = useCallback(
		async (formData: FormData) => {
			const files = (formData.getAll("profile-form") as File[]) || null;
			if (!files || !projectId) {
				return;
			}
			await postProfiles(projectId, files).then((r) => {
				toast.success("Profile(s) successfuly imported.");
				setPostedProfiles(r);
			});
		},
		[projectId],
	);

	useEffect(() => {
		if (projectValidity === "valid") {
			setGraphContainerId(GRAPH_CONTAINER_ID);
		}
	}, [projectValidity]);

	if (projectValidity === "pending") {
		return <section className="grid grid-cols-7 space-x-2 h-full" />;
	}

	return projectValidity === "valid" ? (
		<section className="grid grid-cols-7 space-x-2 h-full">
			<div className="col-span-1 space-y-4 p-2">
				{import.meta.env.VITE_INTERFACE_MODE === "full" && (
					<div className="row-span-1">
						<form action={handleProfileFormSubmit}>
							<div className="grid w-full max-w-sm items-center gap-1.5">
								<Label htmlFor="profile-form">
									Import a new profile (JSON)
								</Label>
								<Input
									id="profile-form"
									name="profile-form"
									type="file"
									accept=".json"
									multiple
									required
								/>
								<Button type="submit">Submit Profile</Button>
							</div>
						</form>
					</div>
				)}
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
			<div className="col-span-5 grid grid-rows-7 items-center">
				{import.meta.env.VITE_SHOW_FULL_INTERFACE === "full" &&
					!currentPattern && (
						<ProfileExplorerPatternBar className="row-span-1" />
					)}
				{currentPattern && (
					<ScrollArea className="row-span-1 h-full mr-8">
						{currentPattern && <ProfilePatternActions />}
						<ProfilePatternEditor className="overflow-x-auto" />
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
				<div
					className={`group relative row-span-${currentPattern ? 6 : 7} h-full`}
				>
					<div
						className="h-full border-gray-500 border"
						id={GRAPH_CONTAINER_ID}
						style={{ height: "99%", width: "98%" }}
					/>
					<BounceLoader
						className="absolute top-1/2 right-1/2"
						color="green"
						cssOverride={{ position: "absolute" }}
						loading={isLoading}
					/>
					{!isLoading && (
						<ProfileExplorerPpmResultsBar className="absolute top-0 m-3" />
					)}
					{!isLoading && (
						<ProfileExplorerGraphSettingsBar className="absolute top-0 right-6 m-3" />
					)}
					{!isLoading && (
						<GraphControls
							graphRenderer={renderer.current}
							className="absolute bottom-2 right-6"
						/>
					)}
				</div>
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
	) : (
		<section>404</section>
	);
}
