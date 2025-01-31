import type { GraphDefinition } from "@/api/client";
import { useColombusStore } from "@/store";
import Graph from "graphology";
import { useEffect, useRef } from "react";
import Sigma from "sigma";
import useGraphUtils from "./useGraphUtils";

export default function useGraph(
	containerId: string | undefined,
	graphDefinitions: GraphDefinition[] | undefined,
) {
	const displayedLevel = useColombusStore((state) => state.displayedLevel);
	const filteredProfilesNames = useColombusStore(
		(state) => state.filteredProfilesNames,
	);
	const currentPattern = useColombusStore((state) => state.currentPattern);
	const availableProfilesWithPpmData = useColombusStore(
		(state) => state.availableProfilesWithPpmData,
	);

	const graph = useRef<Graph>(new Graph());
	const renderer = useRef<Sigma | undefined>();

	const { addNewProfile } = useGraphUtils(graph.current);

	useEffect(() => {
		if (containerId) {
			renderer.current?.kill();
			const graphContainer = document.getElementById("graph-container");
			if (graphContainer) {
				renderer.current = new Sigma(graph.current, graphContainer, {
					autoRescale: false,
				});
			}
		}
	}, [containerId]);

	useEffect(() => {
		graph.current?.clear();
		if (!graphDefinitions || !renderer.current || !graph.current) {
			return;
		}
		let addedX = 0;
		let addedY = 0;
		for (const profile of graphDefinitions) {
			if (!filteredProfilesNames.includes(profile.name)) {
				continue;
			}
			const ppmResData = availableProfilesWithPpmData.filter(
				(pr) => pr.profile_name === profile.name,
			);
			addNewProfile(profile, ppmResData, currentPattern, addedX, addedY);
			// TODO? if (addedX >= maxRowLength) {
			addedY -= 50 * displayedLevel;
			if (ppmResData.length > 0) {
				addedY -= 50;
			}
			addedX = 1;
		}
	}, [
		graphDefinitions,
		availableProfilesWithPpmData,
		currentPattern,
		filteredProfilesNames,
		displayedLevel,
		addNewProfile,
	]);

	useEffect(() => {
		return () => {
			renderer.current?.kill();
		};
	}, []);

	return { renderer };
}
