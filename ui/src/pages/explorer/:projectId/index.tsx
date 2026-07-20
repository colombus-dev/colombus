import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { GraphDefinition } from "@/api/client";
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

import usePatternActions from "@/hooks/explorer/usePatternActions";
import useProfileImport from "@/hooks/explorer/useProfileImport";
import useProfileNodesFetcher from "@/hooks/explorer/useProfileNodesFetcher";
import useGraph from "@/hooks/useGraph";
import useGraphPpm from "@/hooks/useGraphPpm";
import useValidProject from "@/hooks/useValidProject";
import { PATH } from "@/lib/constants";

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
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [backendError, setBackendError] = useState<string | null>(null);

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

	const { handleFilesImport, isImporting, postedProfiles } = useProfileImport({
		projectId,
	});

	useProfileNodesFetcher({
		projectId,
		projectValidity,
		postedProfiles,
		filteredWorkflowsNodes,
		setFilteredWorkflowsNodes,
		setIsLoading,
		setBackendError,
	});

	const { handleExecuteCodeSubmit, handleSaveCodeSubmit } = usePatternActions({
		projectId,
		setIsLoading,
		setBackendError,
	});

	useEffect(() => {
		if (isLoading) {
			setFilteredWorkflowsNodes([]);
		}
	}, [isLoading]);

	useEffect(() => {
		if (projectValidity === "valid") {
			setGraphContainerId(GRAPH_CONTAINER_ID);
		}
	}, [projectValidity]);

	if (projectValidity === "pending") {
		return <section className="grid grid-cols-7 space-x-2 h-full" />;
	}

	return projectValidity === "valid" ? (
		<section className="grid grid-cols-7 gap-4 px-4 h-[calc(100vh-76px)] pb-4">
			<div className="col-span-1 flex flex-col h-full space-y-4 p-2 min-h-0">
				<div className="mb-4">
					<p className="font-bold mb-2">Upload</p>
					<ImportModal onImport={handleFilesImport} isImporting={isImporting}>
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
						onSave={handleSaveCodeSubmit}
						backendError={backendError}
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
							<div className="grid grid-cols-2 gap-4 h-full items-center">
								<ProfileScoreDistributionChart />
								<div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] w-full h-full">
									<ProfileStepsFrequencyChart />
								</div>
								<ProfilePatternStatsFreqMatrix className="col-span-2" />
							</div>
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
