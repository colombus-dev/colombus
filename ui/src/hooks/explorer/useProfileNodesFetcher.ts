import { useEffect } from "react";
import type { GraphDefinition } from "@/api/client";
import {
	getAllProfiles,
	getGraphNodes,
	getProfilesScores,
	postApplyPpmFilter,
	postApplyPpmFilterByName,
} from "@/api/client";
import type { PpmResult } from "@/lib/types";
import { useColombusStore } from "@/store";

interface UseProfileNodesFetcherProps {
	projectId?: string;
	projectValidity: "valid" | "invalid" | "pending";
	postedProfiles?: string[];
	filteredWorkflowsNodes?: GraphDefinition[];
	setFilteredWorkflowsNodes: (nodes: GraphDefinition[]) => void;
	setIsLoading: (isLoading: boolean) => void;
	setBackendError: (error: string | null) => void;
}

export default function useProfileNodesFetcher({
	projectId,
	projectValidity,
	postedProfiles,
	filteredWorkflowsNodes,
	setFilteredWorkflowsNodes,
	setIsLoading,
	setBackendError,
}: UseProfileNodesFetcherProps) {
	const currentPattern = useColombusStore((state) => state.currentPattern);
	const setAvailableProfilesWithPpmData = useColombusStore(
		(state) => state.setAvailableProfilesWithPpmData,
	);
	const setAvailableProfilesNames = useColombusStore(
		(state) => state.setAvailableProfilesNames,
	);
	const setFilteredProfilesNames = useColombusStore(
		(state) => state.setFilteredProfilesNames,
	);
	const setProfilesScores = useColombusStore(
		(state) => state.setProfilesScores,
	);

	useEffect(() => {
		if (!projectId || projectValidity !== "valid") {
			return;
		}
		const updateAndMergeWithPosted = async (
			rawWorkflowsNames: string[],
			workflowsPpmData?: PpmResult[],
		) => {
			const workflowsNames = [...new Set(rawWorkflowsNames)];
			setAvailableProfilesNames(workflowsNames);
			// we prioritize newly posted profiles
			const reducedWorkflows = new Set([
				...workflowsNames.filter((w) => postedProfiles?.includes(w)),
				...workflowsNames,
			]);
			setFilteredProfilesNames([...reducedWorkflows]);
			setAvailableProfilesWithPpmData(workflowsPpmData ?? []);
			// Detect which profiles need to be fetched by comparing how many copies of each name exist
			// in workflowsNames vs how many are already loaded in filteredWorkflowsNodes.
			const countInWorkflows = (name: string) =>
				workflowsNames.filter((n) => n === name).length;
			const countInNodes = (name: string) =>
				filteredWorkflowsNodes?.filter((n) => n.name === name).length ?? 0;

			const namesToFetch = [...new Set(workflowsNames)].filter(
				(name) => countInWorkflows(name) > countInNodes(name),
			);

			// Keep existing nodes that are still in the workflows list AND not being re-fetched.
			const graphNodesToKeep =
				filteredWorkflowsNodes?.filter(
					({ name }) =>
						workflowsNames.includes(name) && !namesToFetch.includes(name),
				) ?? [];

			await getGraphNodes(projectId, namesToFetch).then((r) => {
				setFilteredWorkflowsNodes([...graphNodesToKeep, ...r]);
				setIsLoading(false);
			});
		};
		setIsLoading(true);

		getProfilesScores(projectId).then((scores) => {
			setProfilesScores(scores);
		});

		// biome-ignore lint/suspicious/noExplicitAny: error handling
		const handleError = (error: any) => {
			console.error("Pattern execution error:", error);
			setIsLoading(false);
			let detail = error?.response?.data?.detail;
			if (Array.isArray(detail)) {
				// biome-ignore lint/suspicious/noExplicitAny: error handling
				detail = detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
			} else if (typeof detail === "object" && detail !== null) {
				detail = JSON.stringify(detail);
			}
			setBackendError(
				detail || "Execution error: Please check the pattern syntax",
			);
		};

		if (currentPattern?.groups?.length) {
			postApplyPpmFilter(projectId, currentPattern.groups)
				.then((workflowsWithData) =>
					updateAndMergeWithPosted(
						[
							...new Set(
								workflowsWithData.map(({ profile_name }) => profile_name),
							),
						],
						workflowsWithData,
					),
				)
				.catch(handleError);
		} else if (currentPattern?.name) {
			postApplyPpmFilterByName(projectId, currentPattern.name)
				.then((workflowsWithData) =>
					updateAndMergeWithPosted(
						[
							...new Set(
								workflowsWithData.map(({ profile_name }) => profile_name),
							),
						],
						workflowsWithData,
					),
				)
				.catch(handleError);
		} else {
			getAllProfiles(projectId)
				.then((wfs) => updateAndMergeWithPosted(wfs, undefined))
				.catch(handleError);
		}
	}, [
		projectId,
		projectValidity,
		currentPattern,
		postedProfiles,
		setFilteredProfilesNames,
		setAvailableProfilesNames,
		setAvailableProfilesWithPpmData,
		setProfilesScores,
		setFilteredWorkflowsNodes,
		setBackendError,
		setIsLoading,
		filteredWorkflowsNodes,
	]);
}
