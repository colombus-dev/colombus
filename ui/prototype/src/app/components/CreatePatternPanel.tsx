import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GitBranch, TriangleAlert, CheckCircle } from 'lucide-react';
import { Textarea } from './ui/textarea';

const STEP_LEGEND = [
	{ label: "Load data", color: "#ef4444" },
	{ label: "Explore data", color: "#3b82f6" },
	{ label: "Review", color: "#65a30d" },
	{ label: "Prepare data", color: "#a855f7" },
	{ label: "Profile data", color: "#06b6d4" },
	{ label: "Transform data", color: "#f97316" },
	{ label: "Clean data", color: "#ca8a04" },
	{ label: "Split data", color: "#818cf8" },
	{ label: "Inspect data", color: "#84cc16" },
] as const;

const STEP_SUGGESTIONS = Array.from(
	new Set(STEP_LEGEND.map(({ label }) => label.trim()).filter(Boolean)),
);

const PlayGlossyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="drop-shadow-sm">
    <circle cx="12" cy="12" r="11" fill="url(#play-grad)" stroke="#0f172a" strokeWidth="1" />
    <defs>
      <linearGradient id="play-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
    </defs>
    <path d="M9 7.5v9l7.5-4.5z" fill="white" className="drop-shadow-sm" />
  </svg>
);

const StopIcon = ({ isExecuting }: { isExecuting?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" className={isExecuting ? "animate-pulse drop-shadow-sm" : "drop-shadow-sm"}>
    <path 
      d="M7 2h10l5 5v10l-5 5H7l-5-5V7l5-5z" 
      fill="url(#stop-grad)" 
      stroke="#8a0a0a" 
      strokeWidth="1"
    />
    <defs>
      <linearGradient id="stop-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ff7e7e" />
        <stop offset="100%" stopColor="#cc1111" />
      </linearGradient>
    </defs>
    <text 
      x="12" y="15.5" 
      fontSize="7" 
      fontWeight="900" 
      fontFamily="sans-serif" 
      fill="white" 
      textAnchor="middle"
      className="drop-shadow-sm"
    >
      STOP
    </text>
  </svg>
);

// ── Canopus DSL validation ─────────────────────────────────────────────

const DSL_KEYWORDS = new Set(['import', 'pattern', 'start', 'end']);
interface DslDiagnostic {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

function validateDsl(code: string): DslDiagnostic[] {
  const diagnostics: DslDiagnostic[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trimStart();

    // Skip empty lines and comments
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }

    // Check for unclosed strings on this line
    let inString = false;
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === '"' && (col === 0 || line[col - 1] !== '\\')) {
        inString = !inString;
      }
    }

    if (inString) {
      const isTypingStep = /\[step="[^"]*$/.test(line);
      if (!isTypingStep) {
        diagnostics.push({
          line: lineNum,
          column: line.lastIndexOf('"') + 1,
          message: 'Unterminated string literal',
          severity: 'error',
        });
      }
    }

    // Warn if a line uses Python-like syntax (def, class, etc at start of line)
    if (/^(def |class |if |for |while |return |yield )/.test(trimmed)) {
      diagnostics.push({
        line: lineNum,
        column: 1,
        message: `Python syntax detected. Use Canopus DSL (import, pattern, start, end, ->)`,
        severity: 'error',
      });
    }

    // Warn about Python-style assignment vs DSL 'pattern' declaration
    if (/^[a-z_][a-z0-9_]*\s*=\s*(?!\s*$)/i.test(trimmed) && !trimmed.startsWith('pattern') && !trimmed.startsWith('import')) {
      const word = trimmed.split(/\s*=/)[0].trim();
      if (!DSL_KEYWORDS.has(word)) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          message: `Did you mean 'pattern ${word} = ...'?`,
          severity: 'warning',
        });
      }
    }
  }

  return diagnostics;
}

export interface CreatePatternPanelProps {
  dslContent?: string;
  onDslContentChange?: (value: string) => void;
  patternName: string;
  dslCode: string;
  onPatternNameChange?: (value: string) => void;
  onDslCodeChange: (value: string) => void;
  onExecutePattern: (content?: string) => void;
  onSavePattern: (content?: string) => void;
  isExecuting?: boolean;
  hasActiveExecution?: boolean;
  onStopExecution?: () => void;
}

export function CreatePatternPanel({
  dslContent,
  onDslContentChange,
  patternName,
  dslCode,
  onPatternNameChange,
  onDslCodeChange,
  onExecutePattern,
  onSavePattern,
  isExecuting,
  hasActiveExecution,
  onStopExecution,
}: CreatePatternPanelProps) {
  const latestEditorValueRef = useRef('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [caretPosition, setCaretPosition] = useState(0);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [pendingCaretPosition, setPendingCaretPosition] = useState<number | null>(null);

  const editorValue = dslContent ?? [patternName, dslCode].filter(Boolean).join('\n');
  latestEditorValueRef.current = editorValue;

  const getCurrentLine = useCallback((value: string, position: number) => {
    const safePosition = Math.max(0, Math.min(position, value.length));
    const lineStart = value.lastIndexOf("\n", safePosition - 1) + 1;
    const lineEnd = value.indexOf("\n", safePosition);
    return value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
  }, []);

  const suggestionMatches = useMemo(() => {
    const currentLine = getCurrentLine(editorValue, caretPosition);
    const stepMatch = /\[step="([a-z0-9_-]*)$/i.exec(currentLine);

    if (stepMatch) {
      const query = stepMatch[1].toLowerCase();
      return STEP_SUGGESTIONS.filter((step) =>
        step.toLowerCase().startsWith(query),
      ).map(step => ({ label: step, type: 'step' as const }));
    }

    const keywordMatch = /^([a-z]*)$/i.exec(currentLine);
    if (keywordMatch) {
      const query = keywordMatch[1].toLowerCase();
      if ("pattern".startsWith(query) && query.length > 0) {
        return [{ label: "pattern", type: 'pattern' as const }];
      }
    }

    return [];
  }, [caretPosition, editorValue, getCurrentLine]);

  useLayoutEffect(() => {
    if (suggestionMatches.length === 0) {
      setActiveSuggestionIndex(0);
      return;
    }
    setActiveSuggestionIndex((previous) =>
      Math.min(previous, suggestionMatches.length - 1),
    );
  }, [suggestionMatches.length]);

  useLayoutEffect(() => {
    if (pendingCaretPosition === null) {
      return;
    }

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.setSelectionRange(pendingCaretPosition, pendingCaretPosition);
    }
    setPendingCaretPosition(null);
  }, [pendingCaretPosition]);

  const diagnostics = useMemo(() => validateDsl(editorValue), [editorValue]);
  const hasErrors = diagnostics.some(d => d.severity === 'error');
  const hasWarnings = diagnostics.some(d => d.severity === 'warning');

  const commitEditorValue = (nextEditorValue: string) => {
    latestEditorValueRef.current = nextEditorValue;
    if (onDslContentChange) {
      onDslContentChange(nextEditorValue);
      return;
    }
    const [nextPatternName = '', ...rest] = nextEditorValue.split('\n');
    const nextDslCode = rest.join('\n');

    onPatternNameChange?.(nextPatternName);
    onDslCodeChange(nextDslCode);
  };

  const isStopAction = isExecuting || hasActiveExecution;
  const isExecuteDisabled = !isStopAction && (hasErrors || !editorValue.trim());

  const applySuggestion = (suggestion: { label: string, type: 'step' | 'pattern' }) => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const selectionStart =
      textarea.selectionStart ?? caretPosition ?? editorValue.length;
    const selectionEnd =
      textarea.selectionEnd ?? caretPosition ?? editorValue.length;
    const textBeforeSelection = editorValue.slice(0, selectionStart);
    const textAfterSelection = editorValue.slice(selectionEnd);
    const currentLineStart = textBeforeSelection.lastIndexOf("\n") + 1;
    const currentLine = textBeforeSelection.slice(currentLineStart);

    let nextCurrentLine = '';
    let caretOffset = 0;

    if (suggestion.type === 'step') {
      const match = /(.*\[step=")([a-z0-9_-]*)$/i.exec(currentLine);
      if (!match) return;
      const prefix = match[1];
      nextCurrentLine = `${prefix}${suggestion.label}"`;
      caretOffset = nextCurrentLine.length;
    } else if (suggestion.type === 'pattern') {
      const match = /^([a-z]*)$/i.exec(currentLine);
      if (!match) return;
      nextCurrentLine = `pattern Name = [key="value"]`;
      // Place cursor on 'Name' (length of 'pattern ' = 8, 'Name' is 4 chars)
      // So cursor start = 8, end = 12
      caretOffset = 8; // Actually we will set selection to select 'Name'
    }

    const nextEditorValue = `${textBeforeSelection.slice(0, currentLineStart)}${nextCurrentLine}${textAfterSelection}`;

    commitEditorValue(nextEditorValue);
    
    if (suggestion.type === 'pattern') {
      // Small timeout to allow render, then select 'Name'
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(currentLineStart + 8, currentLineStart + 12);
          setCaretPosition(currentLineStart + 12);
        }
      }, 0);
    } else {
      setPendingCaretPosition(currentLineStart + caretOffset);
      textarea.focus();
    }
  };

  return (
    <section className="relative z-30 overflow-visible rounded-xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-200">
        <div className="min-w-0 flex items-center gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Create a new pattern below
          </div>
          {editorValue.trim().length > 0 && !editorValue.trim().startsWith('#') ? (
            <div className="flex items-center gap-1.5">
              {hasErrors ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                  <TriangleAlert className="h-3 w-3" />
                  {diagnostics.filter(d => d.severity === 'error').length} error{diagnostics.filter(d => d.severity === 'error').length > 1 ? 's' : ''}
                </span>
              ) : hasWarnings ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                  <TriangleAlert className="h-3 w-3" />
                  {diagnostics.length} warning{diagnostics.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  <CheckCircle className="h-3 w-3" />
                  Valid DSL
                </span>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
                  if (isStopAction) {
                onStopExecution?.();
                return;
              }
              onExecutePattern(latestEditorValueRef.current);
            }}
                disabled={isExecuteDisabled}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isStopAction
                ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                : `border border-slate-200 bg-slate-50 ${
                      hasErrors || !editorValue.trim()
                    ? 'text-slate-400 opacity-70 cursor-not-allowed'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
            }`}
          >
                {isStopAction ? <StopIcon isExecuting={isExecuting} /> : <PlayGlossyIcon />}
                {isStopAction ? 'Stop execution' : 'Execute pattern'}
          </button>
          <button
            type="button"
            onClick={() => onSavePattern(latestEditorValueRef.current)}
            disabled={hasErrors || !editorValue.trim()}
            className={`inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity ${
              hasErrors ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            Save pattern
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 overflow-visible">
        <div className="relative flex min-h-[118px] bg-white">
          <div className="w-10 shrink-0 border-r border-slate-200 bg-slate-50 px-2 py-3 text-right text-[12px] leading-7 text-slate-400 select-none font-mono">
            1
            <br />
            2
            <br />
            3
            <br />
            4
          </div>
          <Textarea
            ref={textareaRef}
            className="min-h-[118px] w-full resize-none rounded-none border-0 bg-transparent px-3 py-3 font-mono text-[13px] leading-6 shadow-none focus-visible:ring-0"
            value={editorValue}
            onChange={event => {
              commitEditorValue(event.target.value);
              setCaretPosition(event.target.selectionStart ?? event.target.value.length);
            }}
            onClick={event => setCaretPosition(event.currentTarget.selectionStart ?? event.currentTarget.value.length)}
            onSelect={event => setCaretPosition(event.currentTarget.selectionStart ?? event.currentTarget.value.length)}
            onKeyUp={event => setCaretPosition(event.currentTarget.selectionStart ?? event.currentTarget.value.length)}
            onKeyDown={event => {
              if (suggestionMatches.length > 0) {
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  setActiveSuggestionIndex(prev => (prev + 1) % suggestionMatches.length);
                  return;
                }
                if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  setActiveSuggestionIndex(prev => (prev - 1 + suggestionMatches.length) % suggestionMatches.length);
                  return;
                }
                if (event.key === 'Tab' || event.key === 'Enter') {
                  event.preventDefault();
                  applySuggestion(suggestionMatches[activeSuggestionIndex] ?? suggestionMatches[0]);
                  return;
                }
              }

              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                onExecutePattern(latestEditorValueRef.current);
              }
            }}
          />

          {suggestionMatches.length > 0 ? (
            <div className="absolute left-12 top-[calc(100%-0.5rem)] z-50 w-[min(320px,calc(100%-3.5rem))] rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-lg shadow-slate-200/80">
              <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Step suggestions
              </div>
              <div className="max-h-36 overflow-auto pr-1">
                <div className="flex flex-wrap gap-1">
                  {suggestionMatches.map((suggestion, index) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() => applySuggestion(suggestion)}
                      onMouseEnter={() => setActiveSuggestionIndex(index)}
                      className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                      style={{
                        borderColor: activeSuggestionIndex === index ? "#0f172a" : "#e2e8f0",
                        background: activeSuggestionIndex === index ? "#0f172a" : "#f8fafc",
                        color: activeSuggestionIndex === index ? "#ffffff" : "#334155",
                      }}
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-1 px-1 text-[13px] text-slate-600">
                Use Left and Right to choose, then Tab or Enter to accept.
              </div>
            </div>
          ) : diagnostics.length > 0 ? (
            <div className="absolute left-12 bottom-0 translate-y-full z-40 w-[min(400px,calc(100%-3.5rem))] rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-lg shadow-slate-200/80 mt-1">
              <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                DSL Diagnostics
              </div>
              <div className="max-h-28 overflow-auto pr-1 space-y-0.5">
                {diagnostics.map((d, idx) => (
                  <div
                    key={`${d.line}-${d.column}-${idx}`}
                    className={`flex items-start gap-2 rounded-lg px-2 py-1 text-[11px] ${
                      d.severity === 'error'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    <span className="font-mono font-semibold shrink-0">L{d.line}:{d.column}</span>
                    <span>{d.message}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}