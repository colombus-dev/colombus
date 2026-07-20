import { useCallback } from "react";
import { toast } from "sonner";
import {
	getAllPatterns,
	parsePpm,
	postApplyPpmFilter,
	postApplyPpmFilterByName,
	postSavePpm,
} from "@/api/client";
import { useColombusStore } from "@/store";

interface UsePatternActionsProps {
	projectId?: string;
	setIsLoading: (isLoading: boolean) => void;
	setBackendError: (error: string | null) => void;
}

export default function usePatternActions({
	projectId,
	setIsLoading,
	setBackendError,
}: UsePatternActionsProps) {
	const setCurrentPattern = useColombusStore(
		(state) => state.setCurrentPattern,
	);
	const setAllSavedPatterns = useColombusStore(
		(state) => state.setAllSavedPatterns,
	);

	const handleExecuteCodeSubmit = useCallback(
		(content: string) => {
			if (!projectId) {
				return;
			}

			const hasExecutableCode = content.split("\n").some((line) => {
				const trimmed = line.trim();
				return trimmed.length > 0 && !trimmed.startsWith("#");
			});

			if (!hasExecutableCode) {
				return;
			}

			setIsLoading(true);
			setBackendError(null);
			parsePpm(projectId, content)
				.then((p) => {
					setCurrentPattern({ ...p, dsl_content: content });
				})
				// biome-ignore lint/suspicious/noExplicitAny: error handling
				.catch((error: any) => {
					console.error("Parse pattern error:", error);
					let detail = error?.response?.data?.detail;
					if (typeof detail === "object" && detail !== null) {
						detail = JSON.stringify(detail);
					}
					setBackendError(
						detail || "Failed to execute pattern. Please check the logic.",
					);
				})
				.finally(() => {
					setIsLoading(false);
				});
		},
		[projectId, setCurrentPattern, setIsLoading, setBackendError],
	);

	const handleSaveCodeSubmit = useCallback(
		(content: string) => {
			if (!projectId) {
				return;
			}

			const hasExecutableCode = content.split("\n").some((line) => {
				const trimmed = line.trim();
				return trimmed.length > 0 && !trimmed.startsWith("#");
			});

			if (!hasExecutableCode) {
				return;
			}

			setIsLoading(true);
			setBackendError(null);
			parsePpm(projectId, content)
				.then(async (p) => {
					// Execute to validate semantics before saving
					if (p.groups?.length) {
						await postApplyPpmFilter(projectId, p.groups);
					} else if (p.name) {
						await postApplyPpmFilterByName(projectId, p.name);
					}
					const newPattern = { ...p, dsl_content: content };
					setCurrentPattern(newPattern);
					await postSavePpm(projectId, newPattern);
					const all = await getAllPatterns(projectId);
					setAllSavedPatterns(all);
					toast.success("Pattern saved successfully!");
				})
				// biome-ignore lint/suspicious/noExplicitAny: error handling
				.catch((error: any) => {
					console.error("Parse pattern error:", error);
					let detail = error?.response?.data?.detail;
					if (Array.isArray(detail)) {
						detail = detail
							// biome-ignore lint/suspicious/noExplicitAny: error handling
							.map((d: any) => d.msg || JSON.stringify(d))
							.join(", ");
					} else if (typeof detail === "object" && detail !== null) {
						detail = JSON.stringify(detail);
					}
					setBackendError(
						detail || "Execution error: Please check the pattern semantics.",
					);
				})
				.finally(() => {
					setIsLoading(false);
				});
		},
		[
			projectId,
			setCurrentPattern,
			setAllSavedPatterns,
			setIsLoading,
			setBackendError,
		],
	);

	return { handleExecuteCodeSubmit, handleSaveCodeSubmit };
}
