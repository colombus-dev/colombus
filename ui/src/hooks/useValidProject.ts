import { postRetrieveProjectName } from "@/api/client";
import { useColombusStore } from "@/store";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

export default function useValidProject() {
	const [projectValidity, setProjectValidity] = useState<
		"valid" | "invalid" | "pending"
	>("pending");

	const { projectId } = useParams<{ projectId: string }>();
	const apiKey = useColombusStore((state) => state.apiKey);

	useEffect(() => {
		if (!apiKey) {
			return;
		}
		if (!projectId) {
			setProjectValidity("invalid");
			return;
		}
		postRetrieveProjectName(projectId, apiKey)
			.then(() => {
				// TODO: use name
				setProjectValidity("valid");
			})
			.catch(() => setProjectValidity("invalid"));
	}, [apiKey, projectId]);

	const projectStatus = useMemo(
		() => ({ validity: projectValidity, projectId }),
		[projectValidity, projectId],
	);

	return projectStatus;
}
