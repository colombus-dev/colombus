import { useState } from 'react';
import { Menu, Trash2 } from 'lucide-react';

export type SavedPattern = {
  id: string;
  name: string;
  code: string;
};

const getDisplayName = (name: string) => {
  const match = /^(?:pattern\s+)?([a-zA-Z0-9_\-\s]+?)\s*=/i.exec(name.trim());
  return match ? match[1].trim() : name;
};



export interface SidebarProps {
  projectName?: string;
  activeView?: 'home' | 'explorer';
  onNavigate?: (view: 'home' | 'explorer') => void;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  onProfileImport?: (file: File) => void;
  savedPatterns?: SavedPattern[];
  onEditPattern?: (pattern: SavedPattern) => void;
  onDeletePattern?: (patternId: string) => void;
}

export function Sidebar({
  projectName = 'Project workspace',
  activeView = 'explorer',
  onNavigate,
  isMenuOpen = true,
  onToggleMenu,
  onProfileImport,
  savedPatterns = [],
  onEditPattern,
  onDeletePattern,
}: SidebarProps) {
  const [selectedProfileName, setSelectedProfileName] = useState('None…');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState('');

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        borderRadius: 18,
        border: '1px solid var(--sidebar-border)',
        background: 'var(--card)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 26px rgba(15,23,42,0.06)',
        fontFamily: 'var(--font-sans)',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          position: 'relative',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={onToggleMenu}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              border: 'none',
              background: 'transparent',
              color: 'var(--muted-foreground)',
              boxShadow: 'none',
              padding: 0,
            }}
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {!isMenuOpen ? null : (
          <>


            <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
                Import a new profile
              </div>

              <label
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  minWidth: 0,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  padding: '10px 12px',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
                }}
              >
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>Choose file</span>
                <span style={{ flexShrink: 0, fontSize: 11, color: 'var(--muted-foreground)' }}>{selectedProfileName}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0];

                    if (!file) {
                      return;
                    }

                    setSelectedProfileName(file.name);
                    setSelectedFile(file);
                  }}
                />
              </label>

              <div className="relative">
                <select
                  value={selectedTaxonomy}
                  onChange={e => setSelectedTaxonomy(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] cursor-pointer"
                  style={{
                    background: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e") no-repeat right 0.5rem center/1.5em 1.5em var(--card)'
                  }}
                >
                  <option value="" disabled>Choose taxonomy...</option>
                  <option value="standard">Taxonomie Standard</option>
                  <option value="advanced">Taxonomie Avancée</option>
                  <option value="custom">Taxonomie Personnalisée</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (selectedFile && selectedTaxonomy) {
                    onProfileImport?.(selectedFile);
                    setSelectedFile(null);
                    setSelectedProfileName('None…');
                    setSelectedTaxonomy('');
                  }
                }}
                disabled={!selectedFile || !selectedTaxonomy}
                className="w-full rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
              >
                Submit
              </button>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
                Saved patterns
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: 14,
                  fontSize: 12,
                  color: 'var(--foreground)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {savedPatterns && savedPatterns.length > 0 ? (
                  savedPatterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="group cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => onEditPattern?.(pattern)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'var(--secondary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }} title={pattern.name}>
                        {getDisplayName(pattern.name)}
                      </span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button
                          type="button"
                          title="Delete pattern"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Êtes-vous sûr de vouloir supprimer ce pattern ?")) {
                              onDeletePattern?.(pattern.id);
                            }
                          }}
                          className="hover:text-red-600 transition-colors"
                          style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--muted-foreground)' }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <span style={{ color: 'var(--muted-foreground)' }}>Saved patterns will be listed here...</span>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
