import { useState } from 'react';
import { Menu, Trash2, ChevronDown } from 'lucide-react';
import { useColombusStore } from '@/store';
import type { Pattern } from '@/lib/types';

const getDisplayName = (name: string) => {
  if (!name) return 'Unnamed Pattern';
  const match = /^(?:pattern\s+)?([a-zA-Z0-9_\-\s]+?)\s*=/i.exec(name.trim());
  return match ? match[1].trim() : name;
};

export interface SidebarProps {
  onProfileImport?: (file: File, taxonomy: string) => void;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
}

export function Sidebar({
  isMenuOpen = true,
  onToggleMenu,
  onProfileImport,
}: SidebarProps) {
  const [selectedProfileName, setSelectedProfileName] = useState('None…');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState('');

  const savedPatterns = useColombusStore((state) => state.allSavedPatterns);
  const setCurrentPattern = useColombusStore((state) => state.setCurrentPattern);
  const setAllSavedPatterns = useColombusStore((state) => state.setAllSavedPatterns);

  const onDeletePattern = (patternToDelete: Pattern) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce pattern ?")) {
      setAllSavedPatterns(savedPatterns.filter(p => p !== patternToDelete));
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-white border-r border-slate-200 transition-all duration-300"
      style={{ width: isMenuOpen ? '280px' : '64px' }}
    >
      <div className="flex flex-col gap-6 p-4 overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          {isMenuOpen && <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Workspace</span>}
          <button
            type="button"
            onClick={onToggleMenu}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {isMenuOpen && (
          <>
            <section className="flex flex-col gap-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                Import Profile
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all cursor-pointer group">
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    {selectedFile ? selectedFile.name : 'Choose file'}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-600">Browse</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={event => {
                      const file = event.target.files?.[0];
                      if (file) {
                        setSelectedProfileName(file.name);
                        setSelectedFile(file);
                      }
                    }}
                  />
                </label>

                <div className="relative">
                  <select
                    value={selectedTaxonomy}
                    onChange={e => setSelectedTaxonomy(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:ring-2 focus:ring-slate-900/5 transition-all cursor-pointer"
                  >
                    <option value="" disabled>Choose taxonomy...</option>
                    <option value="standard">Standard Taxonomy</option>
                    <option value="advanced">Advanced Taxonomy</option>
                    <option value="custom">Custom Taxonomy</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedFile && selectedTaxonomy) {
                      onProfileImport?.(selectedFile, selectedTaxonomy);
                      setSelectedFile(null);
                      setSelectedTaxonomy('');
                    }
                  }}
                  disabled={!selectedFile || !selectedTaxonomy}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.98]"
                >
                  Submit Profile
                </button>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                Saved Patterns
              </div>

              <div className="flex flex-col gap-1.5">
                {savedPatterns.length > 0 ? (
                  savedPatterns.map((pattern, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentPattern(pattern)}
                      className="group flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <span className="text-xs font-medium text-slate-700 truncate" title={pattern.name}>
                        {getDisplayName(pattern.name || '')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePattern(pattern);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-4 border border-dashed border-slate-200 rounded-xl text-center">
                    <span className="text-[11px] text-slate-400 italic">No patterns saved yet</span>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
