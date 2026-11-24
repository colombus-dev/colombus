import { useCallback } from "react";
import { toast } from "sonner";
import {
	getAllPatterns,
	getApiErrorMessage,
	parsePpm,
	postSavePpm,
} from "@/api/client";
import { useColombusStore } from "@/store";

interface UsePatternActionsProps {
	projectId?: string;
	setIsLoading: (isLoading: boolean) => void;
	setBackendError: (error: string | null) => void;
}

function hasExecutableCode(content: string) {
	return content.split("\n").some((line) => {
		const trimmed = line.trim();
		return trimmed.length > 0 && !trimmed.startsWith("#");
	});
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
			if (projectId === undefined || !hasExecutableCode(content)) {
				return;
			}

			setIsLoading(true);
			setBackendError(null);
			parsePpm(projectId, content)
				.then((p) => {
					setCurrentPattern({ ...p, dsl_content: content });
				})
				.catch((error) => {
					console.error("Failed to parse pattern", error);
					const message = getApiErrorMessage(
						error,
						"Failed to execute pattern. Please check the pattern syntax.",
					);
					setBackendError(message);
					setIsLoading(false);
					toast.error(message);
				});
		},
		[projectId, setCurrentPattern, setIsLoading, setBackendError],
	);

	const handleSaveCodeSubmit = useCallback(
		(content: string) => {
			if (projectId === undefined || !hasExecutableCode(content)) {
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
				.catch((error) => {
					console.error("Failed to save pattern", error);
					const message = getApiErrorMessage(
						error,
						"Failed to save pattern. Please check the pattern syntax.",
					);
					setBackendError(message);
					setIsLoading(false);
					toast.error(message);
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
