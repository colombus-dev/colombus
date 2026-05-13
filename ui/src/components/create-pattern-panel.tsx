import { GitBranch, Loader2, Trash } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { getAllPatterns, postSavePpm, parsePpm } from "@/api/client";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import DeletePatternDialog from "./delete-pattern-dialog";

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
		<title>Play</title>
		<circle
			cx="12"
			cy="12"
			r="11"
			fill="url(#play-grad)"
			stroke="#0f172a"
			strokeWidth="1"
		/>
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
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		className={isExecuting ? "animate-pulse drop-shadow-sm" : "drop-shadow-sm"}
	>
		<title>Stop</title>
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
			x="12"
			y="15.5"
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

interface CreatePatternPanelProps {
	onSubmitted: (content: string) => void;
	className?: string;
	onStopExecution?: () => void;
}

export default function CreatePatternPanel({
	onSubmitted,
	className,
	onStopExecution,
}: CreatePatternPanelProps) {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const executionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [pendingCaretPosition, setPendingCaretPosition] = useState<
		number | null
	>(null);
	const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
	const [caretPosition, setCaretPosition] = useState(0);
	const [isExecuting, setIsExecuting] = useState(false);

	const currentPattern = useColombusStore((state) => state.currentPattern);
	const setAvailablePatterns = useColombusStore(
		(state) => state.setAllSavedPatterns,
	);

	const { projectId } = useParams<{ projectId: string }>();

	const editorValue =
		currentPattern?.dsl_content ?? "# Create a new pattern below\n";

	const getCurrentLine = useCallback((value: string, position: number) => {
		const safePosition = Math.max(0, Math.min(position, value.length));
		const lineStart = value.lastIndexOf("\n", safePosition - 1) + 1;
		const lineEnd = value.indexOf("\n", safePosition);
		return value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
	}, []);

	const suggestionMatches = useMemo(() => {
		const currentLine = getCurrentLine(editorValue, caretPosition);
		const match = /\[step="([a-z0-9_-]*)$/i.exec(currentLine);

		if (!match) {
			return [] as string[];
		}

		const query = match[1].toLowerCase();
		return STEP_SUGGESTIONS.filter((step) =>
			step.toLowerCase().startsWith(query),
		);
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

	const commitEditorValue = (nextEditorValue: string) => {
		useColombusStore.getState().setCurrentPattern({
			...currentPattern,
			dsl_content: nextEditorValue,
		});
	};

	const applySuggestion = (suggestion: string) => {
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
		const match = /(.*\[step=")([a-z0-9_-]*)$/i.exec(currentLine);

		if (!match) {
			return;
		}

		const prefix = match[1];
		const nextCurrentLine = `${prefix}${suggestion}"`;
		const nextEditorValue = `${textBeforeSelection.slice(0, currentLineStart)}${nextCurrentLine}${textAfterSelection}`;

		commitEditorValue(nextEditorValue);
		setPendingCaretPosition(currentLineStart + nextCurrentLine.length);
		textarea.focus();
	};

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

	const handleExecute = useCallback(() => {
		if (executionTimeoutRef.current) {
			clearTimeout(executionTimeoutRef.current);
		}
		setIsExecuting(true);
		onSubmitted(editorValue);
		executionTimeoutRef.current = setTimeout(() => {
			setIsExecuting(false);
			executionTimeoutRef.current = null;
		}, 1200);
	}, [onSubmitted, editorValue]);

	const handleStop = useCallback(() => {
		if (executionTimeoutRef.current) {
			clearTimeout(executionTimeoutRef.current);
			executionTimeoutRef.current = null;
		}
		setIsExecuting(false);
		onStopExecution?.();
	}, [onStopExecution]);

	useEffect(() => {
		return () => {
			if (executionTimeoutRef.current) {
				clearTimeout(executionTimeoutRef.current);
				executionTimeoutRef.current = null;
			}
		};
	}, []);

	const handleSave = useCallback(() => {
		if (!projectId || !editorValue.trim()) return;

		const savePromise = parsePpm(projectId, editorValue).then((parsed) => {
			const patternToSave = { ...parsed, dsl_content: editorValue };
			return postSavePpm(projectId, patternToSave).then(() =>
				getAllPatterns(projectId).then(setAvailablePatterns),
			);
		});

		toast.promise(savePromise, {
			loading: "Saving pattern...",
			success: "Pattern saved successfully.",
			error: "Failed to save pattern. Please check your syntax.",
		});
	}, [projectId, editorValue, setAvailablePatterns]);

	const hasActiveExecution = isExecuting || !!currentPattern?.groups?.length;

	return (
		<section
			id="create-pattern-panel"
			className={cn(
				"relative z-30 overflow-visible rounded-xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
				className,
			)}
		>
			<div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
				<div className="min-w-0">
					<div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
						CREATE A NEW PATTERN BELOW
					</div>
				</div>

				<div className="flex flex-shrink-0 items-center gap-2">
					{hasActiveExecution && (
						<button
							type="button"
							onClick={handleStop}
							className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
						>
							<StopIcon isExecuting={isExecuting} />
							Stop execution
						</button>
					)}

					<DeletePatternDialog patternName={currentPattern?.name}>
						<button
							type="button"
							title="Delete Pattern"
							disabled={currentPattern?.name === undefined}
							className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<Trash className="h-4 w-4" />
						</button>
					</DeletePatternDialog>

					<button
						type="button"
						onClick={handleExecute}
						disabled={isExecuting}
						className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold transition-colors ${
							isExecuting
								? "cursor-wait text-slate-400 opacity-70"
								: "text-slate-600 hover:bg-slate-100"
						}`}
					>
						{isExecuting ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<PlayGlossyIcon />
						)}
						{isExecuting ? "Executing..." : "Execute pattern"}
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={!(currentPattern?.groups && projectId)}
						className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<GitBranch className="h-3.5 w-3.5" />
						Save pattern
					</button>
				</div>
			</div>

			<div className="border-b border-slate-200 overflow-visible">
				<div className="relative flex min-h-[118px] bg-white">
					<div className="w-10 shrink-0 border-r border-slate-200 bg-slate-50 px-2 py-3 text-right text-[12px] leading-7 text-slate-400 select-none font-mono">
						1<br />
						2<br />
						3<br />4
					</div>
					<textarea
						ref={textareaRef}
						value={editorValue}
						onChange={(event) => {
							commitEditorValue(event.target.value);
							setCaretPosition(
								event.target.selectionStart ?? event.target.value.length,
							);
						}}
						onClick={(event) =>
							setCaretPosition(
								event.currentTarget.selectionStart ??
									event.currentTarget.value.length,
							)
						}
						onSelect={(event) =>
							setCaretPosition(
								event.currentTarget.selectionStart ??
									event.currentTarget.value.length,
							)
						}
						onKeyUp={(event) =>
							setCaretPosition(
								event.currentTarget.selectionStart ??
									event.currentTarget.value.length,
							)
						}
						onKeyDown={(event) => {
							if (event.key === "ArrowRight" && suggestionMatches.length > 0) {
								event.preventDefault();
								setActiveSuggestionIndex(
									(previous) => (previous + 1) % suggestionMatches.length,
								);
								return;
							}

							if (event.key === "ArrowLeft" && suggestionMatches.length > 0) {
								event.preventDefault();
								setActiveSuggestionIndex(
									(previous) =>
										(previous - 1 + suggestionMatches.length) %
										suggestionMatches.length,
								);
								return;
							}

							if (
								(event.key === "Tab" || event.key === "Enter") &&
								suggestionMatches.length > 0
							) {
								event.preventDefault();
								applySuggestion(
									suggestionMatches[activeSuggestionIndex] ??
										suggestionMatches[0],
								);
							}
						}}
						spellCheck={false}
						className="min-h-[118px] w-full resize-none bg-white px-4 py-3 font-mono text-[13px] leading-7 text-slate-900 outline-none"
					/>

					{suggestionMatches.length > 0 ? (
						<div className="absolute left-12 top-[calc(100%-0.5rem)] z-50 w-[min(320px,calc(100%-3.5rem))] rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-lg shadow-slate-200/80">
							<div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
								Suggestions de step
							</div>
							<div className="max-h-36 overflow-auto pr-1">
								<div className="flex flex-wrap gap-1">
									{suggestionMatches.map((suggestion, index) => (
										<button
											key={suggestion}
											type="button"
											onClick={() => applySuggestion(suggestion)}
											onMouseEnter={() => setActiveSuggestionIndex(index)}
											className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
											style={{
												borderColor:
													activeSuggestionIndex === index
														? "#0f172a"
														: "#e2e8f0",
												background:
													activeSuggestionIndex === index
														? "#0f172a"
														: "#f8fafc",
												color:
													activeSuggestionIndex === index
														? "#ffffff"
														: "#334155",
											}}
										>
											{suggestion}
										</button>
									))}
								</div>
							</div>
							<div className="mt-1 px-1 text-[13px] text-black">
								Utilise les flèches pour choisir, puis Tab ou Entrée pour
								accepter et fermer le guillemet.
							</div>
						</div>
					) : null}
				</div>
			</div>
		</section>
	);
}
