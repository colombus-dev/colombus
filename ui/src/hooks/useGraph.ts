import { createNodeImageProgram } from "@sigma/node-image";
import Graph from "graphology";
import { useEffect, useRef } from "react";
import Sigma from "sigma";
import type { GraphDefinition } from "@/api/client";
import type { PpmResult } from "@/lib/types";
import { useColombusStore } from "@/store";
import useGraphUtils from "./useGraphUtils";

export default function useGraph(
	containerId: string | undefined,
	graphDefinitions: GraphDefinition[] | undefined,
) {
	const displayedLevel = useColombusStore((state) => state.displayedLevel);
	const filteredProfileIds = useColombusStore(
		(state) => state.filteredProfileIds,
	);
	const currentPattern = useColombusStore((state) => state.currentPattern);
	const availableProfilesWithPpmData = useColombusStore(
		(state) => state.availableProfilesWithPpmData,
	);
	const availableProfileIds = useColombusStore(
		(state) => state.availableProfileIds,
	);

	const graph = useRef<Graph>(new Graph());
	const renderer = useRef<Sigma | undefined>(undefined);

	const { addNewProfile } = useGraphUtils(graph.current);

	useEffect(() => {
		if (containerId) {
			const graphContainer = document.getElementById("graph-container");
			if (graphContainer) {
				renderer.current = new Sigma(graph.current, graphContainer, {
					nodeProgramClasses: {
						image: createNodeImageProgram({
							keepWithinCircle: false,
							objectFit: "contain",
						}),
					},
					autoRescale: false,
					defaultDrawNodeLabel(context, data, settings) {
						if (!data.label) return;

						const size = settings.labelSize;
						const font = settings.labelFont;
						const weight = settings.labelWeight;

						context.font = `${weight} ${size}px ${font}`;
						const width = context.measureText(data.label).width + 8;

						context.fillStyle = "#ffffffcc";
						context.fillRect(
							data.x + data.size,
							data.y + size / 3 - 15,
							width,
							20,
						);

						context.fillStyle = "#000";
						context.fillText(
							data.label,
							data.x + data.size + 3,
							data.y + size / 3,
						);
					},
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
		const positions = new Map(
			availableProfileIds.map((id, index) => [id, index]),
		);
		const selected = new Set(filteredProfileIds);
		const ppmByProfile = new Map<string, PpmResult[]>();
		for (const pr of availableProfilesWithPpmData) {
			const group = ppmByProfile.get(pr.profile_id);
			if (group === undefined) {
				ppmByProfile.set(pr.profile_id, [pr]);
			} else {
				group.push(pr);
			}
		}
		const sortedGraphDefinition = graphDefinitions
			.filter((profile) => selected.has(profile.id))
			.toSorted(
				(a, b) =>
					(positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
					(positions.get(b.id) ?? Number.MAX_SAFE_INTEGER),
			);
		for (const profile of sortedGraphDefinition) {
			const ppmResData = ppmByProfile.get(profile.id) ?? [];
			addNewProfile(profile, ppmResData, currentPattern, addedX, addedY);
			addedY -= 50 * (displayedLevel + 2);
			addedX = 1;
		}
	}, [
		graphDefinitions,
		availableProfilesWithPpmData,
		availableProfileIds,
		currentPattern,
		filteredProfileIds,
		displayedLevel,
		addNewProfile,
	]);

	return { renderer };
}
