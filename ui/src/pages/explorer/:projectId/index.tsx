import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { GraphDefinition } from "@/api/client";
import {
  getAllProfiles,
  getGraphNodes,
  getAllPatterns,
  parsePpm,
  postApplyPpmFilter,
  postApplyPpmFilterByName,
  postNotebookOrProfiles,
  postSavePpm,
} from "@/api/client";
import { CreatePatternPanel } from "../../../../prototype/src/app/components/CreatePatternPanel";
import GraphContainer from "@/components/graph-container";
import NotebookScoresPanel from "@/components/notebook-scores-panel";
import ProfileExplorerPpmResultsBar from "@/components/profile-explorer-ppm-results-bar";
import useGraph from "@/hooks/useGraph";
import useGraphPpm from "@/hooks/useGraphPpm";
import useValidProject from "@/hooks/useValidProject";
import { DEFAULT_DSL_CODE } from "@/lib/constants";
import type { PpmResult } from "@/lib/types";
import { useColombusStore } from "@/store";
import { Sidebar } from "@/components/Sidebar";

const GRAPH_CONTAINER_ID = "graph-container";
type ExplorerWorkspaceTab = "explorer" | "statistics";

export default function ExplorerProjectIdPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ExplorerWorkspaceTab>("explorer");
  const [dslContent, setDslContent] = useState(DEFAULT_DSL_CODE.trim());
  const [isExecuting, setIsExecuting] = useState(false);
  const [graphContainerId, setGraphContainerId] = useState<
    string | undefined
  >();
  const executionAbortControllerRef = useRef<AbortController | null>(null);
  const activeExecutionIdRef = useRef(0);
  const isExecutionStoppedRef = useRef(false);
  const [filteredWorkflowsNodes, setFilteredWorkflowsNodes] = useState<
    GraphDefinition[] | undefined
  >();
  const [postedProfiles, setPostedProfiles] = useState<string[] | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const currentPattern = useColombusStore((state) => state.currentPattern);
  const resetCurrentPattern = useColombusStore(
    (state) => state.resetCurrentPattern,
  );
  const availableProfilesNames = useColombusStore(
    (state) => state.availableProfilesNames,
  );
  const availableProfilesWithPpmData = useColombusStore(
    (state) => state.availableProfilesWithPpmData,
  );
  const filteredProfilesNames = useColombusStore(
    (state) => state.filteredProfilesNames,
  );
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
  const setAvailablePatterns = useColombusStore(
    (state) => state.setAllSavedPatterns,
  );

  const { validity: projectValidity, projectId } = useValidProject();

  const { renderer, visibleStepNames } = useGraph(
    graphContainerId,
    filteredWorkflowsNodes,
  );

  useEffect(() => {
    setIsExecuting(false);
    executionAbortControllerRef.current?.abort();
    executionAbortControllerRef.current = null;
    activeExecutionIdRef.current += 1;
    isExecutionStoppedRef.current = true;
    setFilteredWorkflowsNodes(undefined);
    setPostedProfiles(undefined);
    setIsLoading(false);
  }, [projectId]);

  useGraphPpm(renderer.current);

  useEffect(() => {
    if (activeTab !== "explorer" || !graphContainerId || isLoading) {
      return;
    }

    const animationFrameId = requestAnimationFrame(() => {
      renderer.current?.refresh({ skipIndexation: true });
      renderer.current?.getCamera().animatedReset();
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [activeTab, graphContainerId, isLoading, renderer]);

  const navigate = useNavigate();

  useEffect(() => {
    if (projectValidity === "invalid") {
      toast.error("Project not found.");
      navigate("/explorer");
    }
  }, [projectValidity, navigate]);

  useEffect(() => {
    setDslContent(currentPattern?.dsl_content ?? DEFAULT_DSL_CODE.trim());
  }, [currentPattern?.dsl_content]);

  const notebookScores = useMemo(() => {
    const uniqueProfiles = [...new Set(availableProfilesNames)];
    const maxScore = availableProfilesWithPpmData.reduce((max, profile) => {
      return Math.max(max, profile.results.length);
    }, 0);

    return uniqueProfiles.map((name) => {
      const profileData = availableProfilesWithPpmData.find(
        (profile) => profile.profile_name === name,
      );
      const resultCount = profileData?.results.length ?? 0;
      const score = maxScore > 0 ? resultCount / maxScore : 0;

      return {
        id: name,
        name,
        score,
      };
    });
  }, [availableProfilesNames, availableProfilesWithPpmData]);

  const displayedNotebookScores = useMemo(() => {
    return notebookScores.filter((notebook) =>
      filteredProfilesNames.includes(notebook.name),
    );
  }, [filteredProfilesNames, notebookScores]);

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
        workflowsNames.filter((workflowsName) =>
          postedProfiles?.includes(workflowsName),
        ),
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
          // setNotebookScores([]);
          return "Profile successfully imported.";
        },
        error: (err) => `Failed to import profile: ${err.message}`,
      });
    },
    [projectId],
  );

  const handleExecuteCodeSubmit = useCallback(
    (content?: string) => {
      if (!projectId) {
        return;
      }

      const contentToExecute = content ?? dslContent;
      executionAbortControllerRef.current?.abort();
      executionAbortControllerRef.current = new AbortController();
      const executionId = activeExecutionIdRef.current + 1;
      activeExecutionIdRef.current = executionId;
      isExecutionStoppedRef.current = false;

      setIsExecuting(true);
      parsePpm(
        projectId,
        contentToExecute,
        executionAbortControllerRef.current.signal,
      )
        .then((p) => {
          if (
            isExecutionStoppedRef.current ||
            activeExecutionIdRef.current !== executionId
          ) {
            return;
          }
          setCurrentPattern({ ...p, dsl_content: contentToExecute });
        })
        .catch((error) => {
          if (
            error?.code === "ERR_CANCELED" ||
            error?.name === "CanceledError"
          ) {
            return;
          }
          if (
            isExecutionStoppedRef.current ||
            activeExecutionIdRef.current !== executionId
          ) {
            return;
          }
          toast.error(
            error?.response?.data?.detail || "Failed to execute pattern",
          );
        })
        .finally(() => {
          if (activeExecutionIdRef.current === executionId) {
            setIsExecuting(false);
            executionAbortControllerRef.current = null;
          }
        });
    },
    [dslContent, projectId, setCurrentPattern],
  );

  const handleSavePattern = useCallback(
    (content?: string) => {
      if (!projectId) {
        return;
      }

      const contentToSave = content ?? dslContent;
      const savePromise = parsePpm(projectId, contentToSave).then(
        (parsedPattern) => {
          const patternToSave = {
            ...parsedPattern,
            dsl_content: contentToSave,
          };
          return postSavePpm(projectId, patternToSave).then(() =>
            getAllPatterns(projectId).then(setAvailablePatterns),
          );
        },
      );

      toast.promise(savePromise, {
        loading: "Saving pattern...",
        success: "Pattern saved successfully.",
        error: "Failed to save pattern. Please check your syntax.",
      });
    },
    [dslContent, projectId, setAvailablePatterns],
  );

  const handleStopExecution = useCallback(() => {
    isExecutionStoppedRef.current = true;
    executionAbortControllerRef.current?.abort();
    executionAbortControllerRef.current = null;
    setIsExecuting(false);
    resetCurrentPattern();
    toast.success("Execution stopped.");
  }, [resetCurrentPattern]);

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
          <div className="grid grid-cols-[260px_minmax(0,1fr)] gap-4 flex-1 min-h-0 overflow-hidden">
            <div className="min-w-0 overflow-hidden">
              <ProfileExplorerPpmResultsBar className="h-full" />
            </div>
            <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-200 px-4 py-4">
                <CreatePatternPanel
                  dslContent={dslContent}
                  onDslContentChange={setDslContent}
                  patternName=""
                  dslCode=""
                  onPatternNameChange={undefined}
                  onDslCodeChange={() => undefined}
                  onExecutePattern={handleExecuteCodeSubmit}
                  onStopExecution={handleStopExecution}
                  isExecuting={isExecuting}
                  hasActiveExecution={
                    isExecuting || !!currentPattern?.groups?.length
                  }
                  onSavePattern={handleSavePattern}
                />
              </div>

              <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("explorer")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "explorer"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Explorer
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("statistics")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "statistics"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Statistics
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden p-4 relative">
                <div
                  className={
                    activeTab === "explorer"
                      ? "flex h-full min-h-0 flex-col overflow-hidden gap-4"
                      : "hidden"
                  }
                >
                  <div className="flex-1 min-h-0">
                    <GraphContainer
                      className="group relative h-full w-full"
                      containerId={GRAPH_CONTAINER_ID}
                      isLoading={isLoading}
                      stepNames={visibleStepNames}
                      graphRenderer={renderer.current}
                    />
                  </div>
                </div>
                <div
                  className={
                    activeTab === "statistics"
                      ? "h-full min-h-0 overflow-hidden"
                      : "hidden"
                  }
                >
                  <NotebookScoresPanel notebooks={displayedNotebookScores} />
                </div>
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
