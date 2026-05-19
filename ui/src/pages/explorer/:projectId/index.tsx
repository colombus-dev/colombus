import { CirclePlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { GraphDefinition } from "@/api/client";
import {
	getAllProfiles,
	getGraphNodes,
	parsePpm,
	postApplyPpmFilter,
	postApplyPpmFilterByName,
	postNotebookOrProfiles,
	NotebookFileExtension,
	ProfileFileExtension,
} from "@/api/client";
import GraphContainer from "@/components/graph-container";
import ProfilePatternActions from "@/components/profile-pattern-actions";
import PatternDslEditor from "@/components/profile-pattern-dsl-editor";
import ProfilePatternList from "@/components/profile-pattern-list";
import ProfilePatternStatsFreqMatrix from "@/components/profile-pattern-stats-freq-matrix";
import ProfileStepsFrequencyChart from "@/components/profile-steps-frequency-chart";
import ProjectTaxonomyList from "@/components/project-taxonomy-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import useGraph from "@/hooks/useGraph";
import useGraphPpm from "@/hooks/useGraphPpm";
import useValidProject from "@/hooks/useValidProject";
import type { PpmResult } from "@/lib/types";
import { useColombusStore } from "@/store";
import {PATH} from "@/lib/constants";

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
			navigate(PATH.EXPLORER);
		}
	}, [projectValidity, navigate]);

	// TODO
	// biome-ignore lint/correctness/useExhaustiveDependencies: we should refactor this file
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
			).union(new Set(workflowsNames));
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
		if (currentPattern?.groups?.length) {
			postApplyPpmFilter(projectId, currentPattern.groups).then(
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

	const handleNotebookOrProfileFormSubmit = useCallback(
		async (formData: FormData) => {
			const files = (formData.getAll("notebook-or-profile-form") as File[]) || null;
			if (!files || !projectId) {
				return;
			}
			toast.promise(postNotebookOrProfiles(projectId, files), {
				loading: "Loading...",
				success: (r) => {
					setPostedProfiles(r);
					return "Profiles successfully imported.";
				},
				error: ({
					response: {
						data: { detail },
					},
				}) => `Failed to import profile(s). ${detail}`,
			});
		},
		[projectId],
	);

	const handleExecuteCodeSubmit = useCallback(
		(content: string) => {
			if (!projectId) {
				return;
			}
			parsePpm(projectId, content).then((p) => {
				// TODO: check sync here
				setCurrentPattern({ ...p, dsl_content: content });
			});
		},
		[projectId, setCurrentPattern],
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
					<>
						<p className="font-bold">Upload</p>
						<div className="row-span-1">
							<form action={handleNotebookOrProfileFormSubmit}>
								<div className="grid w-full max-w-sm items-center gap-1.5">
									<Label htmlFor="notebook-or-profile-form">
										Notebooks or profiles
									</Label>
									<Input
										id="notebook-or-profile-form"
										name="notebook-or-profile-form"
										type="file"
										accept={NotebookFileExtension + ',' + ProfileFileExtension}
										multiple
										required
									/>
									<Button type="submit">Submit Profile</Button>
								</div>
							</form>
						</div>
					</>
				)}
				<p className="font-bold">Patterns Statistics</p>
				<ProfilePatternStatsFreqMatrix />
				<ProfileStepsFrequencyChart />
				<p className="font-bold">Saved patterns</p>
				<div className="col-span-2">
					<Button
						className="w-full"
						onClick={() => setCurrentPattern({ groups: [] })}
					>
						<CirclePlus />
						Create new pattern
					</Button>
				</div>
				<Separator />
				<ProfilePatternList />
			</div>
			<div className="col-span-5 grid grid-rows-10 items-center">
				{currentPattern && <ProfilePatternActions />}
				{currentPattern && projectId && (
					<PatternDslEditor
						className="group relative row-span-2 h-full"
						onSubmitted={handleExecuteCodeSubmit}
					/>
				)}
				<GraphContainer
					className="group relative row-span-10 h-full"
					containerId={GRAPH_CONTAINER_ID}
					isLoading={isLoading}
					graphRenderer={renderer.current}
				/>
			</div>
			<div className="col-span-1">
				<ProjectTaxonomyList className="space-y-4" />
			</div>
		</section>
	) : (
		<section>404</section>
	);
}
