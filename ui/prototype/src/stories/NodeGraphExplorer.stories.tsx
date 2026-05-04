import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import { NodeGraph } from '../app/components/NodeGraph';
import { sampleFocusRange, samplePatternName, sampleVisibleNotebooks } from './storybookData';

const meta = {
  title: 'Dashboard/NodeGraph/Explorer',
  component: NodeGraph,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof NodeGraph>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedArgs = {
  selectedNodeId: null,
  onNodeSelect: () => undefined,
  visibleNotebookIds: sampleVisibleNotebooks.map(item => item.id),
  visibleNotebooks: sampleVisibleNotebooks,
  heatmapPatternName: samplePatternName,
  heatmapFocusRange: sampleFocusRange,
};

export const Overview: Story = {
  args: sharedArgs,
};

export const ResultsOnly: Story = {
  render: () => {
    const initialNotebookIds = sampleVisibleNotebooks.map(item => item.id);

    function ResultsOnlyPanel() {
      const [selectedNotebookIds, setSelectedNotebookIds] = useState<string[]>(initialNotebookIds);

      const selectedNotebookSet = useMemo(() => new Set(selectedNotebookIds), [selectedNotebookIds]);
      const allSelected = selectedNotebookIds.length === initialNotebookIds.length;

      const toggleAll = () => {
        setSelectedNotebookIds(allSelected ? [] : initialNotebookIds);
      };

      const toggleNotebook = (notebookId: string) => {
        setSelectedNotebookIds(previous => (
          previous.includes(notebookId)
            ? previous.filter(id => id !== notebookId)
            : [...previous, notebookId]
        ));
      };

      return (
        <div className="p-5">
          <div className="w-[260px] rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">Résultats</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-900">
                {selectedNotebookIds.length} notebooks
              </span>
            </div>

            <div className="mb-3 h-8 rounded-md border border-slate-200 bg-slate-50 px-2" />

            <button
              type="button"
              onClick={toggleAll}
              className="mb-2 flex w-full items-center gap-2 rounded-md border-b border-slate-100 pb-2 text-left"
            >
              <div className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-slate-300 bg-slate-900 text-[9px] font-bold text-white">
                {allSelected ? '✓' : ''}
              </div>
              <span className="text-sm font-semibold text-slate-900">Cochez tout</span>
            </button>

            <div className="space-y-1.5">
              {sampleVisibleNotebooks.map(item => {
                const isSelected = selectedNotebookSet.has(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleNotebook(item.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <div
                      className="flex h-4 w-4 items-center justify-center rounded-[3px] border text-[9px] font-bold"
                      style={{
                        background: isSelected ? '#111827' : '#fff',
                        borderColor: isSelected ? '#111827' : '#cbd5e1',
                        color: isSelected ? '#fff' : 'transparent',
                      }}
                    >
                      ✓
                    </div>
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-400" />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">
                      {item.name}
                    </span>
                    <span className="shrink-0 text-[10px] font-bold text-slate-900">{item.score}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return <ResultsOnlyPanel />;
  },
};

export const ControlsOnly: Story = {
  render: () => (
    <div className="p-5">
      <div className="w-[240px] rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-3 text-sm font-semibold text-slate-900">Displayed levels:</div>
        <div className="mb-3 h-8 rounded-md border border-slate-200 bg-slate-50 px-2" />
        <div className="mb-2 text-sm font-semibold text-slate-900">Customization:</div>
        <div className="space-y-2 text-[12px] text-slate-500">
          <div>Use weighted nodes</div>
          <div>Show all nodes</div>
          <div>Show fixed nodes</div>
          <div>Show variable nodes</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2">
          <span className="text-[11px] text-slate-500">Library Loading</span>
          <span className="text-[11px] text-slate-500">Visualization</span>
          <span className="text-[11px] text-slate-500">Others</span>
        </div>
      </div>
    </div>
  ),
};

export const GraphOnly: Story = {
  render: () => (
    <div className="p-5">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mx-auto flex min-h-[340px] max-w-[920px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white">
          <div className="text-sm font-semibold text-slate-900">NodeGraph Explorer</div>
          <div className="mt-2 text-xs text-slate-500">Use the full Overview story for the live graph.</div>
        </div>
      </div>
    </div>
  ),
};