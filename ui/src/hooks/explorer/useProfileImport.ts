import { useCallback, useState } from "react";
import { postNotebookOrProfiles } from "@/api/client";

interface UseProfileImportProps {
	projectId?: string;
}

export default function useProfileImport({ projectId }: UseProfileImportProps) {
	const [isImporting, setIsImporting] = useState<boolean>(false);
	const [postedProfiles, setPostedProfiles] = useState<string[] | undefined>();

	const handleFilesImport = useCallback(
		(files: File[]) => {
			if (!files || files.length === 0 || !projectId) {
				return Promise.resolve();
			}
			setIsImporting(true);
			return (
				postNotebookOrProfiles(projectId, files)
					.then((r) => {
						setPostedProfiles(r);
					})
					// biome-ignore lint/suspicious/noExplicitAny: error handling
					.catch((error: any) => {
						console.error("Failed to import profile(s)", error);
						const detail = error?.response?.data?.detail;
						throw new Error(
							typeof detail === "string"
								? detail
								: "Failed to import file(s). Please check the file format.",
						);
					})
					.finally(() => {
						setIsImporting(false);
					})
			);
		},
		[projectId],
	);

	return { handleFilesImport, isImporting, postedProfiles };
}
