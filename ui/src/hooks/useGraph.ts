import { createNodeImageProgram } from "@sigma/node-image";
import Graph from "graphology";
import { useEffect, useRef, useState } from "react";
import Sigma from "sigma";
import type { GraphDefinition } from "@/api/client";
import { useColombusStore } from "@/store";
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
	const availableProfilesNames = useColombusStore(
		(state) => state.availableProfilesNames,
	);

	const graph = useRef<Graph>(new Graph());
	const [renderer, setRenderer] = useState<Sigma | undefined>(undefined);

	const { addNewProfile } = useGraphUtils(graph.current);

	useEffect(() => {
		if (containerId) {
			const graphContainer = document.getElementById("graph-container");
			if (graphContainer) {
				const sig = new Sigma(graph.current, graphContainer, {
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
				setRenderer(sig);
			}
		} else {
			setRenderer((prev: Sigma | undefined) => {
				prev?.kill();
				return undefined;
			});
		}
	}, [containerId]);

	useEffect(() => {
		graph.current?.clear();
		if (!graphDefinitions || !renderer || !graph.current) {
			return;
		}
		let addedX = 0;
		let addedY = 0;
		const sortedGraphDefinition = graphDefinitions.toSorted((a, b) =>
			availableProfilesNames.indexOf(a.name) >
			availableProfilesNames.indexOf(b.name)
				? 1
				: -1,
		);
		for (const profile of sortedGraphDefinition) {
			if (!filteredProfilesNames.includes(profile.name)) {
				continue;
			}
			const ppmResData = availableProfilesWithPpmData.filter(
				(pr) => pr.profile_name === profile.name,
			);
			addNewProfile(profile, ppmResData, currentPattern, addedX, addedY);
			addedY -= 50 * (displayedLevel + 2);
			addedX = 1;
		}
	}, [
		graphDefinitions,
		availableProfilesWithPpmData,
		availableProfilesNames,
		currentPattern,
		filteredProfilesNames,
		displayedLevel,
		addNewProfile,
		renderer,
	]);

	useEffect(() => {
		return () => {
			setRenderer((prev: Sigma | undefined) => {
				prev?.kill();
				return undefined;
			});
		};
	}, []);

	return { renderer };
}
