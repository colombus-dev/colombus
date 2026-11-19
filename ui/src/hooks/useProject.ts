import { isAxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import type { ProfileSummary } from "@/api/client";
import { getApiErrorMessage, getProject } from "@/api/client";
import { useColombusStore } from "@/store";

type ProjectValidity = "pending" | "valid" | "invalid";

export default function useProject(refreshKey: unknown) {
	const { projectId } = useParams<{ projectId: string }>();
	const [validity, setValidity] = useState<ProjectValidity>("pending");
	const [profiles, setProfiles] = useState<ProfileSummary[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const setProjectName = useColombusStore((state) => state.setProjectName);
	const setProfilesScores = useColombusStore(
		(state) => state.setProfilesScores,
	);
	const setProfilesNames = useColombusStore((state) => state.setProfilesNames);
	const resetProjectState = useColombusStore(
		(state) => state.resetProjectState,
	);

	useEffect(() => {
		resetProjectState();
	}, [resetProjectState]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey refetches the project after an import
	useEffect(() => {
		if (projectId === undefined) {
			setValidity("invalid");
			return;
		}
		let cancelled = false;
		setError(null);
		getProject(projectId)
			.then((project) => {
				if (cancelled) {
					return;
				}
				setProjectName(project.name);
				setProfiles(project.profiles);
				setProfilesScores(
					Object.fromEntries(
						project.profiles.map(({ id, score }) => [id, score]),
					),
				);
				setProfilesNames(
					Object.fromEntries(
						project.profiles.map(({ id, name }) => [id, name]),
					),
				);
				setValidity("valid");
			})
			.catch((err) => {
				if (cancelled) {
					return;
				}
				if (isAxiosError(err) && err.response?.status === 404) {
					setValidity("invalid");
					return;
				}
				console.error("Failed to load project", err);
				setError(getApiErrorMessage(err, "Failed to load notebooks."));
				setValidity("valid");
			});
		return () => {
			cancelled = true;
		};
	}, [
		projectId,
		refreshKey,
		setProjectName,
		setProfilesScores,
		setProfilesNames,
	]);

	return useMemo(
		() => ({ validity, projectId, profiles, error }),
		[validity, projectId, profiles, error],
	);
}
