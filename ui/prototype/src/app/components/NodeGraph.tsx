import { useMemo, useState } from 'react';
import NotebookScoresPanel from './NotebookScoresPanel';
import { STEP_LEGEND } from './stepLegend';

type DisplayLevel = 'workflow' | 'step' | 'metainstruction' | 'code';
type NodeMode = 'all' | 'fixed' | 'variable';
type GraphTab = 'trees' | 'heatmap';

export interface NodeGraphProps {
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  visibleNotebookIds?: string[];
  visibleNotebooks?: Array<{ id: string; name: string; score: number }>;
  heatmapPatternName?: string | null;
  heatmapFocusRange?: { start: number; end: number } | null;
}

interface NotebookTree {
  id: string;
  label: string;
  score: number;
  color: string;
}

const NOTEBOOK_TREES: NotebookTree[] = [
  { id: 'nb1', label: 'load_data.ipynb', score: 0.94, color: '#0d9488' },
  { id: 'nb2', label: 'inspect_values.ipynb', score: 0.87, color: '#0891b2' },
  { id: 'nb3', label: 'prepare_features.ipynb', score: 0.82, color: '#6366f1' },
  { id: 'nb4', label: 'encode_features.ipynb', score: 0.79, color: '#f59e0b' },
  { id: 'nb5', label: 'normalize_data.ipynb', score: 0.76, color: '#ec4899' },
  { id: 'nb6', label: 'filter_outliers.ipynb', score: 0.73, color: '#8b5cf6' },
  { id: 'nb7', label: 'review_summary.ipynb', score: 0.91, color: '#10b981' },
  { id: 'nb8', label: 'split_data.ipynb', score: 0.68, color: '#f97316' },
  { id: 'nb9', label: 'pipeline_prep_v1.ipynb', score: 0.85, color: '#06b6d4' },
  { id: 'nb10', label: 'pipeline_prep_v2.ipynb', score: 0.71, color: '#ef4444' },
];

export const NODES = NOTEBOOK_TREES.map(tree => ({
  id: tree.id,
  label: tree.label,
  type: 'notebook',
}));



const DISPLAY_LEVELS: Array<{ value: DisplayLevel; label: string; nodeCount: number; description: string }> = [
  { value: 'workflow', label: 'Workflow', nodeCount: 1, description: 'Vue globale des profils' },
  { value: 'step', label: 'Step', nodeCount: 4, description: 'Étapes principales du pipeline' },
  { value: 'metainstruction', label: 'Metainstruction', nodeCount: 7, description: 'Règles et filtres métiers' },
  { value: 'code', label: 'Code', nodeCount: 11, description: 'Vue la plus détaillée' },
];

const NODE_MODE_OPTIONS: Array<{ value: NodeMode; label: string }> = [
  { value: 'all', label: 'Show all nodes' },
  { value: 'fixed', label: 'Show fixed nodes' },
  { value: 'variable', label: 'Show variable nodes' },
];

const LEVEL_ORDER: DisplayLevel[] = ['workflow', 'step', 'metainstruction', 'code'];
const DENSE_MODE_THRESHOLD = 50;

const DISPLAY_LEVEL_CONFIG: Record<DisplayLevel, { tierCount: number; tierLabels: string[][]; nodeOpacity: number }> = {
  workflow: {
    tierCount: 1,
    tierLabels: [['workflow']],
    nodeOpacity: 0.95,
  },
  step: {
    tierCount: 2,
    tierLabels: [['workflow'], ['load', 'clean', 'transform', 'train']],
    nodeOpacity: 0.98,
  },
  metainstruction: {
    tierCount: 3,
    tierLabels: [['workflow'], ['load', 'clean', 'transform', 'train'], ['meta', 'filter', 'rule', 'check', 'validate', 'group', 'guard']],
    nodeOpacity: 0.9,
  },
  code: {
    tierCount: 4,
    tierLabels: [['workflow'], ['load', 'clean', 'transform', 'train'], ['meta', 'filter', 'rule', 'check', 'validate', 'group', 'guard'], ['cell', 'function', 'class', 'variable', 'branch', 'loop', 'call', 'scope', 'assert', 'exception', 'output']],
    nodeOpacity: 0.82,
  },
};

const TREE_COLORS = ['#0d9488', '#0891b2', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

function scoreToColor(score: number) {
  if (score >= 85) return '#16a34a';
  if (score >= 70) return '#d97706';
  return '#dc2626';
}

function buildTreeFromNotebook(notebook: { id: string; name: string; score: number }, index: number): NotebookTree {
  return {
    id: notebook.id,
    label: notebook.name,
    score: Number(notebook.score.toFixed(2)),
    color: TREE_COLORS[index % TREE_COLORS.length],
  };
}


export function NodeGraph({
  selectedNodeId,
  onNodeSelect,
  visibleNotebookIds,
  visibleNotebooks,
  heatmapPatternName,
  heatmapFocusRange,
}: NodeGraphProps) {
  void selectedNodeId;
  void onNodeSelect;

  const [displayLevel, setDisplayLevel] = useState<DisplayLevel>('step');
  const [useWeightedNodes, setUseWeightedNodes] = useState(true);
  const [nodeMode, setNodeMode] = useState<NodeMode>('fixed');
  const [activeTab, setActiveTab] = useState<GraphTab>('trees');
  const [checkedTrees, setCheckedTrees] = useState<Record<string, boolean>>({});

  const sourceTrees = useMemo<NotebookTree[]>(() => {
    if (visibleNotebooks && visibleNotebooks.length > 0) {
      const filtered = visibleNotebookIds && visibleNotebookIds.length > 0
        ? visibleNotebooks.filter(notebook => visibleNotebookIds.includes(notebook.id))
        : visibleNotebooks;

      return filtered.map((notebook, index) => buildTreeFromNotebook(notebook, index));
    }

    if (visibleNotebookIds && visibleNotebookIds.length > 0) {
      return NOTEBOOK_TREES.filter(tree => visibleNotebookIds.includes(tree.id));
    }

    return NOTEBOOK_TREES;
  }, [visibleNotebookIds, visibleNotebooks]);

  const displayedTrees = useMemo(
    () => sourceTrees.filter(tree => checkedTrees[tree.id] ?? true),
    [checkedTrees, sourceTrees]
  );

  const sortedDisplayedTrees = useMemo(
    () => [...displayedTrees].sort((left, right) => left.score - right.score),
    [displayedTrees]
  );

  const allChecked = sourceTrees.length > 0 && sourceTrees.every(tree => checkedTrees[tree.id] ?? true);
  const someChecked = sourceTrees.some(tree => checkedTrees[tree.id] ?? true);

  const toggleAll = () => {
    const nextValue = !allChecked;
    setCheckedTrees(Object.fromEntries(sourceTrees.map(tree => [tree.id, nextValue])));
  };

  const toggleTree = (id: string) => {
    setCheckedTrees(previous => ({ ...previous, [id]: !(previous[id] ?? true) }));
  };

  const levelConfig = DISPLAY_LEVEL_CONFIG[displayLevel];
  const isDenseMode = displayedTrees.length > DENSE_MODE_THRESHOLD;
  const isTreesTab = activeTab === 'trees';

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 10,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 12,
    padding: 12,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 12,
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: 0.2 }}>
        <defs>
          <pattern id="dotgrid" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="11" cy="11" r="0.7" fill="#cbd5e1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>

      <div className="relative z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {[
            { id: 'trees', label: 'Explorer' },
            { id: 'heatmap', label: 'Statistics' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as GraphTab)}
              className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: activeTab === tab.id ? '#111827' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#475569',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      <div className="relative z-10 flex-1 overflow-hidden">
        {isTreesTab ? (
          <div className="flex h-full min-h-0 gap-4 px-4 py-4">
            <main className="min-w-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm">
              <div className="space-y-4">
                {displayedTrees.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">Aucun notebook sélectionné</div>
                ) : displayedTrees.map((tree) => {
                  const stepColors = ['#14b8a6', '#06b6d4', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16', '#f97316', '#22c55e'];
                  const activeNodeOpacity = levelConfig.nodeOpacity;
                  const visibleTiers = LEVEL_ORDER.slice(0, levelConfig.tierCount);

                  return (
                    <div
                      key={tree.id}
                      className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
                    >
                      <div className="flex min-w-0 flex-col items-center">
                        <div
                          className="shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold"
                          style={{
                            borderColor: `${tree.color}66`,
                            color: tree.color,
                            background: `${tree.color}10`,
                            boxShadow: 'none',
                            maxWidth: 260,
                          }}
                        >
                          <span className="block truncate">{tree.label}</span>
                        </div>

                        <div className="relative mt-4 flex min-h-[120px] w-full justify-center">
                          <div
                            className="absolute left-1/2 top-0 w-px -translate-x-1/2"
                            style={{
                              height: 14,
                              background: `linear-gradient(180deg, ${tree.color}88 0%, rgba(148,163,184,0.18) 100%)`,
                            }}
                          />
                          <div className="absolute left-1/2 top-[14px] h-px w-[72%] -translate-x-1/2 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

                          <div className="relative mt-5 flex w-full max-w-[920px] flex-col gap-7 px-3">
                            {visibleTiers.map((tier, tierIndex) => {
                              const tierNodes = levelConfig.tierLabels[tierIndex];

                              return (
                                <div key={`${tree.id}-${tier}`} className="relative flex items-start gap-4">
                                  <div className="flex w-24 shrink-0 items-start justify-end pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                                    {tier}
                                  </div>

                                  <div className="relative flex-1">
                                    <div className="absolute left-0 top-5 h-px w-full bg-slate-200" />
                                    <div className="relative flex items-start justify-between gap-3">
                                      {tierNodes.map((nodeLabel, nodeIndex) => {
                                        const fill = tier === 'metainstruction'
                                          ? '#9ca3af'
                                          : tier === 'code'
                                            ? '#111827'
                                            : stepColors[(tierIndex * 3 + nodeIndex) % stepColors.length];
                                        const radius = useWeightedNodes
                                          ? (isDenseMode ? 7 : tierIndex === 0 ? 15 : Math.max(8, 15 - tierIndex - Math.min(nodeIndex, 3)))
                                          : (isDenseMode ? 7 : 10);
                                        const showConnector = nodeIndex !== tierNodes.length - 1;

                                        return (
                                          <div key={`${tree.id}-${tier}-${nodeIndex}`} className="relative flex min-w-0 flex-1 flex-col items-center">
                                            {!isDenseMode && tierIndex > 0 && (
                                              <div
                                                className="absolute -top-7 left-1/2 w-px -translate-x-1/2"
                                                style={{
                                                  height: 28,
                                                  borderLeft: `2px dashed ${fill}55`,
                                                }}
                                              />
                                            )}

                                            <div
                                              className="relative z-10 shrink-0 cursor-default rounded-full"
                                              style={{
                                                width: radius * 2,
                                                height: radius * 2,
                                                background: fill,
                                                opacity: activeNodeOpacity,
                                                boxShadow: 'none',
                                                border: '2px solid white',
                                              }}
                                            />

                                            {!isDenseMode && (
                                              <div
                                                className="mt-1 max-w-[88px] truncate text-center text-[9px] font-medium"
                                                style={{ color: tier === 'metainstruction' ? '#6b7280' : tier === 'code' ? '#111827' : '#9ca3af' }}
                                              >
                                                {nodeLabel}
                                              </div>
                                            )}

                                            {!isDenseMode && showConnector && (
                                              <div className="absolute top-5 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-px bg-gradient-to-r from-slate-300 via-slate-200 to-transparent" />
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            </main>

            <aside className="flex w-[220px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm">
              <div className="mt-3 mb-3 text-sm font-semibold text-slate-900">Displayed levels:</div>
              <div className="mb-3 flex h-8 items-center rounded-md border border-slate-200 bg-slate-50 px-2">
                <select
                  value={displayLevel}
                  onChange={event => setDisplayLevel(event.target.value as DisplayLevel)}
                  className="w-full border-0 bg-transparent text-[12px] text-slate-900 outline-none"
                >
                  {DISPLAY_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-2 text-sm font-semibold text-slate-900">Customization:</div>
              <label className="mb-1 flex items-center gap-2 py-1 text-slate-500">
                <input type="checkbox" checked={useWeightedNodes} onChange={event => setUseWeightedNodes(event.target.checked)} />
                <span className="text-[12px]">Use weighted nodes</span>
              </label>

              {NODE_MODE_OPTIONS.map(option => (
                <label key={option.value} className="mb-1 flex items-center gap-2 py-1 text-slate-500">
                  <input
                    type="radio"
                    name="nodeMode"
                    checked={nodeMode === option.value}
                    onChange={() => setNodeMode(option.value)}
                  />
                  <span className="text-[12px]">{option.label}</span>
                </label>
              ))}

              <div className="mb-3 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2">
                {STEP_LEGEND.map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1">
                    <div className="h-3 w-3 shrink-0 rounded-sm" style={{ background: color }} />
                    <span className="text-[11px] text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        ) : (
          <div className="flex h-full w-full min-w-0 items-start overflow-y-auto px-4 py-4">
            <NotebookScoresPanel
              notebooks={visibleNotebooks || []}
              patternName={heatmapPatternName}
              focusRange={heatmapFocusRange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
