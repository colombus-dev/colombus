import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { GraphDefinition } from "@/api/client";
import {
	getAllProfiles,
	getGraphNodes,
	getProfilesScores,
	NotebookFileExtension,
	ProfileFileExtension,
	parsePpm,
	postApplyPpmFilter,
	postApplyPpmFilterByName,
	postNotebookOrProfiles,
} from "@/api/client";
import GraphContainer from "@/components/graph-container";
import PatternDslEditor from "@/components/profile-pattern-dsl-editor";
import ProfilePatternList from "@/components/profile-pattern-list";
import ProfilePatternStatsFreqMatrix from "@/components/profile-pattern-stats-freq-matrix";
import ProfileScoreDistributionChart from "@/components/profile-score-distribution-chart";
import ProfileStepsFrequencyChart from "@/components/profile-steps-frequency-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useGraph from "@/hooks/useGraph";
import useGraphPpm from "@/hooks/useGraphPpm";
import useValidProject from "@/hooks/useValidProject";
import { PATH } from "@/lib/constants";
import type { PpmResult } from "@/lib/types";
import { useColombusStore } from "@/store";

const GRAPH_CONTAINER_ID = "graph-container";

export default function ExplorerProjectIdPage() {
	const [activeTab, setActiveTab] = useState<"explorer" | "statistics">(
		"explorer",
	);
	const [graphContainerId, setGraphContainerId] = useState<
		string | undefined
	>();
	const [filteredWorkflowsNodes, setFilteredWorkflowsNodes] = useState<
		GraphDefinition[] | undefined
	>();
	const [postedProfiles, setPostedProfiles] = useState<string[] | undefined>();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [executionError, setExecutionError] = useState<string | null>(null);
	const [isImporting, setIsImporting] = useState<boolean>(false);
	const formRef = useRef<HTMLFormElement>(null);

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
	const setProfilesScores = useColombusStore(
		(state) => state.setProfilesScores,
	);

	const setCurrentPattern = useColombusStore(
		(state) => state.setCurrentPattern,
	);

	const { validity: projectValidity, projectId } = useValidProject();

	const { renderer } = useGraph(graphContainerId, filteredWorkflowsNodes);

	useGraphPpm(renderer.current);

	useEffect(() => {
		if (activeTab === "explorer" && renderer.current) {
			renderer.current.refresh();
		}
	}, [activeTab, renderer.current]);

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
			// Detect which profiles need to be fetched by comparing how many copies of each name exist
			// in workflowsNames vs how many are already loaded in filteredWorkflowsNodes.
			const countInWorkflows = (name: string) =>
				workflowsNames.filter((n) => n === name).length;
			const countInNodes = (name: string) =>
				filteredWorkflowsNodes?.filter((n) => n.name === name).length ?? 0;

			const namesToFetch = [...new Set(workflowsNames)].filter(
				(name) => countInWorkflows(name) > countInNodes(name),
			);

			// Keep existing nodes that are still in the workflows list AND not being re-fetched.
			const graphNodesToKeep =
				filteredWorkflowsNodes?.filter(
					({ name }) =>
						workflowsNames.includes(name) && !namesToFetch.includes(name),
				) ?? [];

			await getGraphNodes(projectId, namesToFetch).then((r) => {
				setFilteredWorkflowsNodes([...graphNodesToKeep, ...r]);
				setIsLoading(false);
			});
		};
		setIsLoading(true);
		setExecutionError(null);

		getProfilesScores(projectId).then((scores) => {
			setProfilesScores(scores);
		});

		const handleError = (error: any) => {
			console.error("Pattern execution error:", error);
			setIsLoading(false);
			let detail = error?.response?.data?.detail;
			if (Array.isArray(detail)) {
				detail = detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
			} else if (typeof detail === "object" && detail !== null) {
				detail = JSON.stringify(detail);
			}
			setExecutionError(
				detail
					? `Execution failed: ${detail}`
					: "Execution error: Please check the pattern syntax",
			);
		};

		if (currentPattern?.groups?.length) {
			postApplyPpmFilter(projectId, currentPattern.groups)
				.then((workflowsWithData) =>
					updateAndMergeWithPosted(
						[
							...new Set(
								workflowsWithData.map(({ profile_name }) => profile_name),
							),
						],
						workflowsWithData,
					),
				)
				.catch(handleError);
		} else if (currentPattern?.name) {
			postApplyPpmFilterByName(projectId, currentPattern.name)
				.then((workflowsWithData) =>
					updateAndMergeWithPosted(
						[
							...new Set(
								workflowsWithData.map(({ profile_name }) => profile_name),
							),
						],
						workflowsWithData,
					),
				)
				.catch(handleError);
		} else {
			getAllProfiles(projectId)
				.then((wfs) => updateAndMergeWithPosted(wfs, undefined))
				.catch(handleError);
		}
	}, [
		projectId,
		projectValidity,
		currentPattern,
		postedProfiles,
		setFilteredProfilesNames,
		setAvailableProfilesNames,
		setAvailableProfilesWithPpmData,
		setProfilesScores,
	]);

	useEffect(() => {
		if (isLoading) {
			setFilteredWorkflowsNodes([]);
		}
	}, [isLoading]);

	const handleNotebookOrProfileFormSubmit = useCallback(
		async (formData: FormData) => {
			const files =
				(formData.getAll("notebook-or-profile-form") as File[]) || null;
			if (!files || !projectId) {
				return;
			}
			setIsImporting(true);
			const promise = postNotebookOrProfiles(projectId, files).finally(() => {
				setIsImporting(false);
			});
			toast.promise(promise, {
				loading: "Loading...",
				success: (r) => {
					setPostedProfiles(r);
					formRef.current?.reset();
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
			setExecutionError(null);
			parsePpm(projectId, content)
				.then((p) => {
					// TODO: check sync here
					setCurrentPattern({ ...p, dsl_content: content });
				})
				.catch((error: any) => {
					console.error("Parse pattern error:", error);
					let detail = error?.response?.data?.detail;
					if (typeof detail === "object" && detail !== null) {
						detail = JSON.stringify(detail);
					}
					setExecutionError(
						detail
							? `Failed to parse pattern: ${detail}`
							: "Failed to parse pattern.",
					);
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
		<section className="grid grid-cols-7 gap-4 px-4 h-full">
			<div className="col-span-1 space-y-4 p-2">
				<p className="font-bold">Upload</p>
				<div className="row-span-1">
					<form ref={formRef} action={handleNotebookOrProfileFormSubmit}>
						<div className="grid w-full max-w-sm items-center gap-1.5">
							<Label htmlFor="notebook-or-profile-form">
								Notebooks or profiles
							</Label>
							<Input
								id="notebook-or-profile-form"
								name="notebook-or-profile-form"
								type="file"
								accept={NotebookFileExtension + "," + ProfileFileExtension}
								multiple
								required
							/>
							<Button type="submit" disabled={isImporting}>
								{isImporting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Submit Profile
							</Button>
						</div>
					</form>
				</div>

				<p className="font-bold">Saved patterns</p>
				<ProfilePatternList />
			</div>
			<div className="col-span-6 flex flex-col h-full space-y-4 relative">
				{projectId && (
					<PatternDslEditor
						isExecuting={isLoading}
						onSubmitted={handleExecuteCodeSubmit}
					/>
				)}

				<div className="flex items-center justify-start py-2 border-b border-slate-100 dark:border-slate-800">
					<div className="flex items-center space-x-2">
						<button
							type="button"
							onClick={() => setActiveTab("explorer")}
							className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-all duration-150 cursor-pointer ${
								activeTab === "explorer"
									? "bg-[#0f172a] text-white dark:bg-slate-100 dark:text-slate-950 shadow-sm"
									: "bg-[#f8fafc] text-[#475569] hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
							}`}
						>
							Explorer
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("statistics")}
							className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-all duration-150 cursor-pointer ${
								activeTab === "statistics"
									? "bg-[#0f172a] text-white dark:bg-slate-100 dark:text-slate-950 shadow-sm"
									: "bg-[#f8fafc] text-[#475569] hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
							}`}
						>
							Statistics
						</button>
					</div>
				</div>

				<div
					className={
						activeTab === "explorer"
							? "flex-1 grid grid-rows-10 items-center gap-4 min-h-0"
							: "absolute left-[-9999px] top-[-9999px] invisible pointer-events-none w-full h-full grid grid-rows-10 items-center gap-4 min-h-0"
					}
				>
					<GraphContainer
						className="group relative row-span-10 h-[692px]"
						containerId={GRAPH_CONTAINER_ID}
						isLoading={isLoading}
						graphRenderer={renderer.current}
						errorMessage={executionError}
					/>
				</div>

				<div
					className={
						activeTab === "statistics"
							? "flex-1 min-h-0 py-2"
							: "absolute left-[-9999px] top-[-9999px] invisible pointer-events-none w-full h-full py-2"
					}
				>
					<div className="group relative row-span-10 h-[692px]">
						<div className="w-full h-full border border-slate-200 bg-white rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.04)] p-6 overflow-y-auto relative">
							{executionError && !isLoading && (
								<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold text-xl bg-white p-4 rounded-lg shadow-lg border border-red-200 z-50">
									{executionError}
								</div>
							)}
							{!executionError && (
								<div className="grid grid-cols-2 gap-4 h-full items-center">
									<ProfileScoreDistributionChart />
									<div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] w-full h-full">
										<ProfileStepsFrequencyChart />
									</div>
									<ProfilePatternStatsFreqMatrix className="col-span-2" />
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	) : (
		<section>404</section>
	);
}
