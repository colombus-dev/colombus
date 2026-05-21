import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { postRetrieveProjectName } from "@/api/client";
import { useColombusStore } from "@/store";

export default function useValidProject() {
	const [projectValidity, setProjectValidity] = useState<
		"valid" | "invalid" | "pending"
	>("pending");

	const { projectId } = useParams<{ projectId: string }>();
	const apiKey = useColombusStore((state) => state.apiKey);
	const setProjectName = useColombusStore((state) => state.setProjectName);

	useEffect(() => {
		if (!apiKey) {
			return;
		}
		if (!projectId) {
			setProjectValidity("invalid");
			return;
		}
		postRetrieveProjectName(projectId)
			.then((name) => {
				setProjectName(name);
				setProjectValidity("valid");
			})
			.catch(() => setProjectValidity("invalid"));
	}, [apiKey, projectId, setProjectName]);

	const projectStatus = useMemo(
		() => ({ validity: projectValidity, projectId }),
		[projectValidity, projectId],
	);

	return projectStatus;
}
