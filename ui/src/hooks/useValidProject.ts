import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { postRetrieveProjectName } from "@/api/client";
import { useColombusStore } from "@/store";

export default function useValidProject() {
	const [projectValidity, setProjectValidity] = useState<
		"valid" | "invalid" | "pending"
	>("pending");

	const { projectId } = useParams<{ projectId: string }>();
	const setProjectName = useColombusStore((state) => state.setProjectName);
	const resetProjectState = useColombusStore(
		(state) => state.resetProjectState,
	);

	useEffect(() => {
		if (!projectId) {
			setProjectValidity("invalid");
			return;
		}
		resetProjectState();
		setProjectValidity("pending");
		let cancelled = false;
		postRetrieveProjectName(projectId)
			.then((name) => {
				if (cancelled) {
					return;
				}
				setProjectName(name);
				setProjectValidity("valid");
			})
			.catch(() => {
				if (!cancelled) {
					setProjectValidity("invalid");
				}
			});
		return () => {
			cancelled = true;
		};
	}, [projectId, setProjectName, resetProjectState]);

	const projectStatus = useMemo(
		() => ({ validity: projectValidity, projectId }),
		[projectValidity, projectId],
	);

	return projectStatus;
}
