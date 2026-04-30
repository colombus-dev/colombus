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
import { Sidebar } from "@/components/Sidebar";

const GRAPH_CONTAINER_ID = "graph-container";

export default function ExplorerProjectIdPage() {
	const [isMenuOpen, setIsMenuOpen] = useState(true);
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

	const handleProfileImport = useCallback(
		async (file: File) => {
			if (!file || !projectId) {
				return;
			}
			toast.promise(postNotebookOrProfiles(projectId, [file]), {
				loading: "Importing profile...",
				success: (r) => {
					setPostedProfiles(r);
					return "Profile successfully imported.";
				},
				error: (err) => `Failed to import profile: ${err.message}`,
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
		return <section className="h-full bg-slate-50" />;
	}

	return projectValidity === "valid" ? (
		<section className="flex h-full min-h-0 bg-slate-50 overflow-hidden">
			<Sidebar
				isMenuOpen={isMenuOpen}
				onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
				onProfileImport={handleProfileImport}
			/>
			
			<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
				<div className="p-4 space-y-4 flex flex-col h-full overflow-hidden">
					<div className="grid grid-cols-5 gap-4 flex-1 min-h-0 overflow-hidden">
						<div className="col-span-4 flex flex-col min-h-0 overflow-hidden">
							{currentPattern && <ProfilePatternActions />}
							{currentPattern && projectId && (
								<PatternDslEditor
									className="group relative h-40 shrink-0"
									onSubmitted={handleExecuteCodeSubmit}
								/>
							)}
							<div className="flex-1 min-h-0 mt-4">
								<GraphContainer
									className="group relative h-full w-full"
									containerId={GRAPH_CONTAINER_ID}
									isLoading={isLoading}
									graphRenderer={renderer.current}
								/>
							</div>
						</div>
						<div className="col-span-1 overflow-y-auto pr-1">
							<div className="space-y-6">
								<section>
									<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
										Taxonomy
									</p>
									<ProjectTaxonomyList className="space-y-4" />
								</section>
								
								<Separator />
								
								<section>
									<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
										Statistics
									</p>
									<ProfilePatternStatsFreqMatrix />
									<div className="mt-4">
										<ProfileStepsFrequencyChart />
									</div>
								</section>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	) : (
		<section className="flex h-full items-center justify-center bg-slate-50 text-slate-400">
			404 - Project not found
		</section>
	);
}
