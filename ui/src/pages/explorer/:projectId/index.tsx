import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { GraphDefinition } from "@/api/client";
import {
	getAllProfiles,
	getGraphNodes,
	getKaggleStatus,
	getProfilesScores,
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
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import usePatternActions from "@/hooks/explorer/usePatternActions";
import useGraph from "@/hooks/useGraph";
import useGraphPpm from "@/hooks/useGraphPpm";
import useValidProject from "@/hooks/useValidProject";
import { PATH } from "@/lib/constants";
import type { PpmResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";

const GRAPH_CONTAINER_ID = "graph-container";

type ExplorerTab = "code" | "explorer" | "statistics";

const EXPLORER_TABS: { id: ExplorerTab; label: string }[] = [
	{ id: "code", label: "Code" },
	{ id: "explorer", label: "Explorer" },
	{ id: "statistics", label: "Statistics" },
];

export default function ExplorerProjectIdPage() {
	const [activeTab, setActiveTab] = useState<ExplorerTab>("explorer");
	const [graphContainerId, setGraphContainerId] = useState<
		string | undefined
	>();
	const [filteredWorkflowsNodes, setFilteredWorkflowsNodes] = useState<
		GraphDefinition[] | undefined
	>();
	const [postedProfiles, setPostedProfiles] = useState<string[]>([]);
	const [isKaggleAvailable, setIsKaggleAvailable] = useState<
		boolean | undefined
	>();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [backendError, setBackendError] = useState<string | null>(null);
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

	const { validity: projectValidity, projectId } = useValidProject();

	const { renderer } = useGraph(graphContainerId, filteredWorkflowsNodes);

	useGraphPpm(renderer.current);

	const { handleExecuteCodeSubmit, handleSaveCodeSubmit } = usePatternActions({
		projectId,
		setIsLoading,
		setBackendError,
	});

	useEffect(() => {
		if (activeTab === "explorer" && renderer.current) {
			renderer.current.refresh();
		}
	}, [activeTab, renderer.current]);

	const navigate = useNavigate();

	useEffect(() => {
		if (projectValidity === "invalid") {
			toast.error("Project not found.");
			navigate(PATH.HOME);
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
			const reducedWorkflows = new Set([
				...workflowsNames.filter((w) => postedProfiles?.includes(w)),
				...workflowsNames,
			]);
			setFilteredProfilesNames([...reducedWorkflows]);
			setAvailableProfilesWithPpmData(workflowsPpmData ?? []);

			const countInWorkflows = (name: string) =>
				workflowsNames.filter((n) => n === name).length;
			const countInNodes = (name: string) =>
				filteredWorkflowsNodes?.filter((n) => n.name === name).length ?? 0;

			const namesToFetch = [...new Set(workflowsNames)].filter(
				(name) => countInWorkflows(name) > countInNodes(name),
			);

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
		setBackendError(null);

		const handleError = (error: any) => {
			console.error("Pattern execution error:", error);
			setIsLoading(false);
			let detail = error?.response?.data?.detail;
			if (Array.isArray(detail)) {
				detail = detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
			} else if (typeof detail === "object" && detail !== null) {
				detail = JSON.stringify(detail);
			}
			setBackendError(
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
	]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: refetch scores after an import
	useEffect(() => {
		if (!projectId || projectValidity !== "valid") {
			return;
		}
		getProfilesScores(projectId).then(setProfilesScores);
	}, [projectId, projectValidity, postedProfiles, setProfilesScores]);

	useEffect(() => {
		if (isLoading) {
			setFilteredWorkflowsNodes([]);
		}
	}, [isLoading]);

	const handleFilesImport = useCallback(
		(files: File[]) => {
			if (!files || files.length === 0 || !projectId) {
				return Promise.resolve();
			}
			setIsImporting(true);

			let allPosted: string[] = [];
			let promiseChain = Promise.resolve();

			for (let i = 0; i < files.length; i++) {
				promiseChain = promiseChain.then(() =>
					postNotebookOrProfiles(projectId, [files[i]]).then((r) => {
						allPosted = [...allPosted, ...r];
					}),
				);
			}

			return promiseChain
				.then(() => {
					setPostedProfiles(allPosted);
				})
				.catch((error: any) => {
					console.error("Failed to import profile(s)", error);
					const detail = error?.response?.data?.detail;
					throw new Error(
						typeof detail === "string"
							? detail
							: "Failed to import file(s). Please check the file format.",
					);
				})
				.finally(() => {
					setIsImporting(false);
				});
		},
		[projectId],
	);

	const handleImportOpen = useCallback(() => {
		if (isKaggleAvailable !== undefined) {
			return;
		}
		getKaggleStatus()
			.then(setIsKaggleAvailable)
			.catch(() => setIsKaggleAvailable(false));
	}, [isKaggleAvailable]);

	useEffect(() => {
		if (projectValidity === "valid") {
			setGraphContainerId(GRAPH_CONTAINER_ID);
		}
	}, [projectValidity]);

	const handleKaggleSearch = useCallback(
		(competition: string, pageToken?: string) => {
			if (!projectId) {
				return Promise.resolve({ notebooks: [], next_page_token: null });
			}
			return import("@/api/client")
				.then(({ getKaggleCompetitionNotebooks }) =>
					getKaggleCompetitionNotebooks(projectId, competition, pageToken),
				)
				.catch((error: any) => {
					console.error("Failed to search Kaggle competition", error);
					const detail = error?.response?.data?.detail;
					throw new Error(
						typeof detail === "string"
							? detail
							: "Failed to search Kaggle competition. Please check the inputs.",
					);
				});
		},
		[projectId],
	);

	const handleKaggleImport = useCallback(
		(payload: {
			competition?: string;
			slugs?: string[];
			scores?: Record<string, number>;
		}) => {
			if (!projectId) {
				return Promise.resolve();
			}
			setIsImporting(true);

			let slugsPromise = Promise.resolve<string[]>([]);
			if (payload.slugs) {
				slugsPromise = Promise.resolve(payload.slugs);
			} else if (payload.competition) {
				slugsPromise = handleKaggleSearch(payload.competition).then((result) =>
					result.notebooks.slice(0, 10).map((nb: any) => nb.ref),
				);
			}

			return slugsPromise
				.then((slugsToImport: string[]) => {
					if (slugsToImport.length === 0) return Promise.resolve();

					let allPosted: string[] = [];
					let promiseChain = Promise.resolve();

					return import("@/api/client").then(({ postImportKaggle }) => {
						for (let i = 0; i < slugsToImport.length; i++) {
							promiseChain = promiseChain.then(() =>
								postImportKaggle(projectId, {
									slugs: [slugsToImport[i]],
									scores: payload.scores,
								}).then((r) => {
									allPosted = [...allPosted, ...r];
								}),
							);
						}
						return promiseChain.then(() => {
							setPostedProfiles(allPosted);
						});
					});
				})
				.catch((error: any) => {
					console.error("Failed to import Kaggle competition", error);
					const detail = error?.response?.data?.detail;
					throw new Error(
						typeof detail === "string"
							? detail
							: "Failed to import Kaggle competition. Please check the inputs and ensure your backend has Kaggle credentials.",
					);
				})
				.finally(() => {
					setIsImporting(false);
				});
		},
		[projectId, handleKaggleSearch],
	);

	const handleKaggleCompetitionsSearch = useCallback(
		(search: string) => {
			if (!projectId) {
				return Promise.resolve([]);
			}
			return import("@/api/client")
				.then(({ searchKaggleCompetitions }) =>
					searchKaggleCompetitions(projectId, search),
				)
				.catch((error: any) => {
					console.error("Failed to search Kaggle competitions", error);
					const detail = error?.response?.data?.detail;
					throw new Error(
						typeof detail === "string"
							? detail
							: "Failed to search Kaggle competitions. Please check the inputs.",
					);
				});
		},
		[projectId],
	);

	if (projectValidity === "pending") {
		return <section className="grid grid-cols-7 space-x-2 h-full" />;
	}

	return projectValidity === "valid" ? (
		<section className="grid h-[calc(100vh-76px)] grid-cols-7 gap-4 px-4 pb-4">
			<div className="col-span-1 flex h-full min-h-0 flex-col gap-6 p-2">
				<div className="space-y-2">
					<SectionHeading title="Import" />
					<ImportModal
						onImport={handleFilesImport}
						onImportKaggle={isKaggleAvailable ? handleKaggleImport : undefined}
						onSearchKaggle={isKaggleAvailable ? handleKaggleSearch : undefined}
						onSearchKaggleCompetitions={
							isKaggleAvailable ? handleKaggleCompetitionsSearch : undefined
						}
						onOpen={handleImportOpen}
						isImporting={isImporting}
						render={<Button className="w-full">Import profiles</Button>}
					/>
				</div>

				<div className="flex min-h-0 flex-1 flex-col gap-2">
					<SectionHeading title="Saved patterns" />
					<div className="min-h-0 flex-1 overflow-y-auto">
						<ProfilePatternList />
					</div>
				</div>
			</div>
			<ProfileExplorerPpmResultsBar
				className="col-span-1"
				isLoading={isLoading}
			/>
			<div className="col-span-5 flex min-h-0 flex-col gap-3">
				{projectId && (
					<PatternDslEditor
						className="h-56 shrink-0"
						isExecuting={isLoading}
						onSubmitted={handleExecuteCodeSubmit}
						onSave={handleSaveCodeSubmit}
						backendError={backendError}
					/>
				)}
				<div
					role="tablist"
					aria-label="Explorer views"
					className="flex shrink-0 items-center gap-1 border-b pb-2"
				>
					{EXPLORER_TABS.map((tab) => (
						<button
							key={tab.id}
							type="button"
							role="tab"
							aria-selected={activeTab === tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={cn(
								"cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
								activeTab === tab.id
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
						>
							{tab.label}
						</button>
					))}
				</div>
				<div className="relative min-h-0 flex-1">
					<div
						className={
							activeTab === "explorer"
								? "h-full"
								: "invisible pointer-events-none absolute top-[-9999px] left-[-9999px] h-full w-full"
						}
					>
						<GraphContainer
							className="group relative h-full w-full overflow-hidden"
							containerId={GRAPH_CONTAINER_ID}
							isLoading={isLoading}
							graphRenderer={renderer.current}
						/>
					</div>

					{activeTab === "statistics" && (
						<div className="h-full overflow-y-auto rounded-xl border bg-card p-4">
							<div className="grid grid-cols-2 gap-4">
								<ProfileScoreDistributionChart />
								<ProfileStepsFrequencyChart />
								<ProfilePatternStatsFreqMatrix className="col-span-2" />
							</div>
						</div>
					)}

					{activeTab === "code" && (
						<div className="h-full">
							<ProfileCodeViewer nodes={filteredWorkflowsNodes} />
						</div>
					)}
				</div>
			</div>
		</section>
	) : (
		<section>404</section>
	);
}
