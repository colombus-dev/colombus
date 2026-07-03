import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { GraphDefinition } from "@/api/client";
import {
	getAllProfiles,
	getGraphNodes,
	getProfilesScores,
	parsePpm,
	postApplyPpmFilter,
	postApplyPpmFilterByName,
	postNotebookOrProfiles,
} from "@/api/client";
import GraphContainer from "@/components/graph-container";
import ImportModal from "@/components/import-modal";
import ProfileCodeViewer from "@/components/profile-code-viewer";
import ProfileExplorerPpmResultsBar from "@/components/profile-explorer-ppm-results-bar";
import PatternDslEditor from "@/components/profile-pattern-dsl-editor";
import ProfilePatternList from "@/components/profile-pattern-list";
import ProfilePatternStatsFreqMatrix from "@/components/profile-pattern-stats-freq-matrix";
import ProfileScoreDistributionChart from "@/components/profile-score-distribution-chart";
import ProfileStepsFrequencyChart from "@/components/profile-steps-frequency-chart";
import { Button } from "@/components/ui/button";

import useGraph from "@/hooks/useGraph";
import useGraphPpm from "@/hooks/useGraphPpm";
import useValidProject from "@/hooks/useValidProject";
import { PATH } from "@/lib/constants";
import type { PpmResult } from "@/lib/types";
import { useColombusStore } from "@/store";

const GRAPH_CONTAINER_ID = "graph-container";

export default function ExplorerProjectIdPage() {
	const [activeTab, setActiveTab] = useState<
		"explorer" | "statistics" | "code"
	>("explorer");
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
			rawWorkflowsNames: string[],
			workflowsPpmData?: PpmResult[],
		) => {
			const workflowsNames = [...new Set(rawWorkflowsNames)];
			setAvailableProfilesNames(workflowsNames);
			// we prioritize newly posted profiles
			const reducedWorkflows = new Set([
				...workflowsNames.filter((w) => postedProfiles?.includes(w)),
				...workflowsNames,
			]);
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

	const handleFilesImport = useCallback(
		async (files: File[]) => {
			if (!files || files.length === 0 || !projectId) {
				return;
			}
			setIsImporting(true);
			try {
				const r = await postNotebookOrProfiles(projectId, files);
				setPostedProfiles(r);
			} catch (error: any) {
				console.error("Failed to import profile(s)", error);
				const detail = error?.response?.data?.detail;
				throw new Error(
					typeof detail === "string"
						? detail
						: "Failed to import file(s). Please check the file format.",
				);
			} finally {
				setIsImporting(false);
			}
		},
		[projectId],
	);

	const handleExecuteCodeSubmit = useCallback(
		(content: string) => {
			if (!projectId) {
				return;
			}

			const hasExecutableCode = content.split("\n").some((line) => {
				const trimmed = line.trim();
				return trimmed.length > 0 && !trimmed.startsWith("#");
			});

			if (!hasExecutableCode) {
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

	const handleKaggleImport = useCallback(
		async (payload: { competition?: string; slugs?: string[] }) => {
			if (!projectId) {
				return;
			}
			setIsImporting(true);
			try {
				const { postImportKaggle } = await import("@/api/client");
				const r = await postImportKaggle(projectId, payload);
				setPostedProfiles(r);
			} catch (error: any) {
				console.error("Failed to import Kaggle competition", error);
				const detail = error?.response?.data?.detail;
				throw new Error(
					typeof detail === "string"
						? detail
						: "Failed to import Kaggle competition. Please check the inputs and ensure your backend has Kaggle credentials.",
				);
			} finally {
				setIsImporting(false);
			}
		},
		[projectId],
	);

	if (projectValidity === "pending") {
		return <section className="grid grid-cols-7 space-x-2 h-full" />;
	}

	return projectValidity === "valid" ? (
		<section className="grid grid-cols-7 gap-4 px-4 h-[calc(100vh-76px)] pb-4">
			<div className="col-span-1 flex flex-col h-full space-y-4 p-2 min-h-0">
				<div className="mb-4">
					<p className="font-bold mb-2">Upload</p>
					<ImportModal
						onImport={handleFilesImport}
						onImportKaggle={handleKaggleImport}
						isImporting={isImporting}
					>
						<Button className="w-full">Import profiles</Button>
					</ImportModal>
				</div>

				<div className="flex flex-col flex-1 min-h-0">
					<p className="font-bold shrink-0">Saved patterns</p>
					<div className="flex-1 min-h-0 mt-2">
						<ProfilePatternList />
					</div>
				</div>
			</div>
			<ProfileExplorerPpmResultsBar className="col-span-1" />
			<div className="col-span-5 flex flex-col h-full space-y-4 relative min-h-0">
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
							onClick={() => setActiveTab("code")}
							className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-all duration-150 cursor-pointer ${
								activeTab === "code"
									? "bg-[#0f172a] text-white dark:bg-slate-100 dark:text-slate-950 shadow-sm"
									: "bg-[#f8fafc] text-[#475569] hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
							}`}
						>
							Code
						</button>
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
						className="group relative row-span-10 h-full w-full"
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
					<div className="group relative row-span-10 h-full w-full">
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

				{activeTab === "code" && (
					<div className="flex-1 min-h-0 py-2 h-full">
						<ProfileCodeViewer nodes={filteredWorkflowsNodes} />
					</div>
				)}
			</div>
		</section>
	) : (
		<section>404</section>
	);
}
