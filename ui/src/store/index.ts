import type { PpmResult } from "@/api/client";
import type { PpmNodesDisplayMode } from "@/configuration";
import type { PatternElement } from "@/lib/types";
import { create } from "zustand";
import type { StateCreator } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type Pattern = {
	name?: string;
	elements: PatternElement[];
};
export type Project = {
	id: string;
	name: string;
};

interface ProjectSlice {
	apiKey?: string;
	setApiKey: (key: string) => void;
	currentProject?: Project;
	setCurrentProject: (p: Project) => void;
}

interface PatternSlice {
	currentPattern?: Pattern;
	setCurrentPattern: (p: Pattern) => void;
	resetCurrentPattern: () => void;
	allSavedPatterns: Pattern[];
	setAllSavedPatterns: (p: Pattern[]) => void;
}

interface GraphCustomizationSlice {
	displayedLevel: number; // default 2
	setDisplayedLevel: (level: number) => void;
	useWeightedNodes: boolean; // default true
	setUseWeightedNodes: (uwn: boolean) => void;
	patternCapturedNodesDisplayMode: PpmNodesDisplayMode;
	setPatternCapturedNodesDisplayMode: (mode: PpmNodesDisplayMode) => void;
}

interface ProfilesSlice {
	availableProfilesNames: string[];
	setAvailableProfilesNames: (profiles: string[]) => void;
	availableProfilesWithPpmData: PpmResult[];
	setAvailableProfilesWithPpmData: (data: PpmResult[]) => void;
	filteredProfilesNames: string[];
	setFilteredProfilesNames: (profiles: string[]) => void;
}

interface ColombusStore
	extends ProjectSlice,
		PatternSlice,
		GraphCustomizationSlice,
		ProfilesSlice {}

const createPatternSlice: StateCreator<ColombusStore, [], [], PatternSlice> = (
	set,
) => ({
	currentPattern: undefined,
	setCurrentPattern: (p) => set((state) => ({ ...state, currentPattern: p })),
	resetCurrentPattern: () =>
		set((state) => ({ ...state, currentPattern: undefined })),
	allSavedPatterns: [],
	setAllSavedPatterns: (p) =>
		set((state) => ({ ...state, allSavedPatterns: p })),
});

const createProjectSlice: StateCreator<ColombusStore, [], [], ProjectSlice> = (
	set,
) => ({
	currentProject: undefined,
	setCurrentProject: (p) => set((state) => ({ ...state, currentProject: p })),
	apiKey: undefined,
	setApiKey: (k) => set((state) => ({ ...state, apiKey: k })),
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

const createProfilesSlice: StateCreator<
	ColombusStore,
	[],
	[],
	ProfilesSlice
> = (set) => ({
	availableProfilesNames: [],
	setAvailableProfilesNames: (profiles) =>
		set((state) => ({ ...state, availableProfilesNames: profiles })),
	availableProfilesWithPpmData: [],
	setAvailableProfilesWithPpmData: (data) =>
		set((state) => ({ ...state, availableProfilesWithPpmData: data })),
	filteredProfilesNames: [],
	setFilteredProfilesNames: (profiles) =>
		set((state) => ({ ...state, filteredProfilesNames: profiles })),
});

export const useColombusStore = create<ColombusStore>()(
	devtools(
		persist(
			(...a) => ({
				...createProjectSlice(...a),
				...createPatternSlice(...a),
				...createGraphCustomizationSlice(...a),
				...createProfilesSlice(...a),
			}),
			{
				name: "colombus-storage",
			},
		),
	),
);
