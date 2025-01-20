import type { PpmNodesDisplayMode } from "@/configuration";
import type { PatternElement } from "@/lib/types";
import { create } from "zustand";
import type { StateCreator } from "zustand";
import { devtools, persist } from "zustand/middleware";

type Pattern = {
	name?: string;
	elements: PatternElement[];
};

interface PatternSlice {
	currentPattern?: Pattern;
	setCurrentPattern: (p: Pattern) => void;
	resetCurrentPattern: () => void;
}

interface GraphCustomizationSlice {
	displayedLevel: number; // default 2
	setDisplayedLevel: (level: number) => void;
	useWeightedNodes: boolean; // default true
	setUseWeightedNodes: (uwn: boolean) => void;
	patternCapturedNodesDisplayMode: PpmNodesDisplayMode;
	setPatternCapturedNodesDisplayMode: (mode: PpmNodesDisplayMode) => void;
}

interface ColombusStore extends PatternSlice, GraphCustomizationSlice {}

const createPatternSlice: StateCreator<ColombusStore, [], [], PatternSlice> = (
	set,
) => ({
	currentPattern: undefined,
	setCurrentPattern: (p) => set((state) => ({ ...state, currentPattern: p })),
	resetCurrentPattern: () =>
		set((state) => ({ ...state, currentPattern: undefined })),
});

const createGraphCustomizationSlice: StateCreator<
	ColombusStore,
	[],
	[],
	GraphCustomizationSlice
> = (set) => ({
	displayedLevel: 2,
	setDisplayedLevel: (level) =>
		set((state) => ({ ...state, displayedLevel: level })),
	useWeightedNodes: true,
	setUseWeightedNodes: (uwn) =>
		set((state) => ({ ...state, useWeightedNodes: uwn })),
	patternCapturedNodesDisplayMode: "show-all",
	setPatternCapturedNodesDisplayMode: (mode) =>
		set((state) => ({ ...state, patternCapturedNodesDisplayMode: mode })),
});

export const useColombusStore = create<ColombusStore>()(
	devtools(
		persist(
			(...a) => ({
				...createPatternSlice(...a),
				...createGraphCustomizationSlice(...a),
			}),
			{
				name: "colombus-storage",
			},
		),
	),
);
