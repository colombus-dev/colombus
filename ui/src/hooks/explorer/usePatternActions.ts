import { useCallback } from "react";
import { toast } from "sonner";
import { getAllPatterns, parsePpm, postSavePpm } from "@/api/client";
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
				.catch((error: any) => {
					console.error("Parse pattern error:", error);
					let detail = error?.response?.data?.detail;
					if (typeof detail === "object" && detail !== null) {
						detail = JSON.stringify(detail);
					}
					const message =
						detail || "Failed to execute pattern. Please check the logic.";
					setBackendError(message);
					toast.error(message);
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
					const newPattern = { ...p, dsl_content: content };
					await postSavePpm(projectId, newPattern);
					setAllSavedPatterns(await getAllPatterns(projectId));
					setCurrentPattern(newPattern);
					toast.success("Pattern saved.");
				})
				.catch((error: any) => {
					console.error("Parse pattern error:", error);
					let detail = error?.response?.data?.detail;
					if (Array.isArray(detail)) {
						detail = detail
							.map((d: any) => d.msg || JSON.stringify(d))
							.join(", ");
					} else if (typeof detail === "object" && detail !== null) {
						detail = JSON.stringify(detail);
					}
					const message =
						detail ||
						"Failed to save pattern. Please check the pattern syntax.";
					setBackendError(message);
					toast.error(message);
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
