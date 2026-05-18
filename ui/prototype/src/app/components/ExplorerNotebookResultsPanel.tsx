import { memo, useEffect, useMemo, useState } from 'react';

export interface ExplorerNotebookResult {
  id: string;
  name: string;
  score: number;
}

export interface ExplorerNotebookResultsPanelProps {
  notebooks: ExplorerNotebookResult[];
  selectedNotebookIds?: string[];
  onSelectedNotebookIdsChange?: (nextSelectedNotebookIds: string[]) => void;
}

function scoreToBandColor(score: number) {
  if (score <= 0.2) return '#ef4444';
  if (score <= 0.4) return '#f59e0b';
  if (score <= 0.6) return '#facc15';
  if (score <= 0.8) return '#a7f3d0';
  return '#22c55e';
}

export const ExplorerNotebookResultsPanel = memo(function ExplorerNotebookResultsPanel({
  notebooks,
  selectedNotebookIds,
  onSelectedNotebookIdsChange,
}: ExplorerNotebookResultsPanelProps) {
  const [query, setQuery] = useState('');
  const [internalSelectedNotebookIds, setInternalSelectedNotebookIds] = useState<string[]>(() => notebooks.map(item => item.id));

  const selectedIds = selectedNotebookIds ?? internalSelectedNotebookIds;

  const updateSelectedIds = (nextSelectedIds: string[] | ((previousSelectedIds: string[]) => string[])) => {
    const nextValue = typeof nextSelectedIds === 'function'
      ? nextSelectedIds(selectedIds)
      : nextSelectedIds;

    if (onSelectedNotebookIdsChange) {
      onSelectedNotebookIdsChange(nextValue);
      return;
    }

    setInternalSelectedNotebookIds(nextValue);
  };

  useEffect(() => {
    if (selectedNotebookIds === undefined) {
      setInternalSelectedNotebookIds(notebooks.map(item => item.id));
    }
  }, [notebooks, selectedNotebookIds]);

  const filteredNotebooks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const nextNotebooks = normalizedQuery
      ? notebooks.filter(item => item.name.toLowerCase().includes(normalizedQuery))
      : notebooks;

    return [...nextNotebooks].sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score;
      }

      return left.name.localeCompare(right.name);
    });
  }, [notebooks, query]);

  const selectedNotebookSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allNotebooksSelected = notebooks.length > 0 && selectedIds.length === notebooks.length;

  const toggleAll = () => {
    updateSelectedIds(allNotebooksSelected ? [] : notebooks.map(item => item.id));
  };

  const toggleNotebook = (notebookId: string) => {
    updateSelectedIds(previous => {
      if (previous.includes(notebookId)) {
        return previous.filter(id => id !== notebookId);
      }

      return [...previous, notebookId];
    });
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-900">Résultats</span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-900">
          {selectedIds.length} notebooks
        </span>
      </div>

      <div className="mb-3 h-8 rounded-md border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-400">
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Profils de recherche"
          aria-label="Filtrer les notebooks"
          className="h-full w-full border-0 bg-transparent outline-none placeholder:text-slate-400"
        />
      </div>

      <button
        type="button"
        onClick={toggleAll}
        className="mb-2 flex w-full items-center gap-2 rounded-md border-b border-slate-100 pb-2 text-left"
      >
        <div className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-slate-300 bg-slate-900 text-[9px] font-bold text-white">
          {allNotebooksSelected ? '✓' : ''}
        </div>
        <span className="text-sm font-semibold text-slate-900">Cochez tout</span>
      </button>

      <div className="min-h-0 flex-1 overflow-auto pr-1">
        {filteredNotebooks.length === 0 ? (
          <div className="px-1 py-2 text-xs text-slate-400">Aucun notebook trouvé</div>
        ) : (
          filteredNotebooks.map(item => {
            const isSelected = selectedNotebookSet.has(item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleNotebook(item.id)}
                className="mb-1 flex w-full items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-slate-50"
              >
                <div
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border text-[9px] font-bold"
                  style={{
                    background: isSelected ? '#111827' : '#fff',
                    borderColor: isSelected ? '#111827' : '#cbd5e1',
                    color: isSelected ? '#fff' : 'transparent',
                  }}
                >
                  ✓
                </div>
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: scoreToBandColor(item.score) }}
                />
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {item.name}
                </span>
                <span className="shrink-0 text-[10px] font-bold text-slate-900">
                  {item.score.toFixed(2)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
});

export default ExplorerNotebookResultsPanel;