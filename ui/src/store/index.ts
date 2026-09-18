import type { StateCreator } from "zustand";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { postDiffSort } from "@/api/client";
import type { PpmNodesDisplayMode } from "@/configuration";
import type { DiffResult, Pattern, PpmResult } from "@/lib/types";

interface AuthSlice {
	jwtToken?: string;
	jwtExpiry?: number;
	setJwtToken: (token: string | undefined, expiry?: number) => void;
}

interface DiffSlice {
	referenceDiffProfile?: string;
	diffResults: DiffResult[];
	setReferenceDiffProfile: (r: string) => void;
	resetReferenceDiffProfile: () => void;
}

interface PatternSlice {
	currentPattern?: Pattern;
	setCurrentPattern: (p: Pattern) => void;
	resetCurrentPattern: () => void;
	allSavedPatterns: Pattern[];
	setAllSavedPatterns: (p: Pattern[]) => void;
	patternAppendTrigger?: string;
	setPatternAppendTrigger: (t?: string) => void;
}

interface GraphCustomizationSlice {
	displayedLevel: number; // default 2
	setDisplayedLevel: (level: number) => void;
	useWeightedNodes: boolean; // default true
	setUseWeightedNodes: (uwn: boolean) => void;
	pathsDisplayMode: PpmNodesDisplayMode;
	setPathsDisplayMode: (mode: PpmNodesDisplayMode) => void;
	scoreEvolutionFilter: number; // 1 = Decreasing, 2 = Constant, 3 = Increasing
	setScoreEvolutionFilter: (filter: number) => void;
	useScoreEvolutionFilter: boolean;
	setUseScoreEvolutionFilter: (use: boolean) => void;
}

interface ProfilesSlice {
	availableProfilesNames: string[];
	setAvailableProfilesNames: (profiles: string[]) => void;
	availableProfilesWithPpmData: PpmResult[];
	setAvailableProfilesWithPpmData: (data: PpmResult[]) => void;
	filteredProfilesNames: string[];
	setFilteredProfilesNames: (profiles: string[]) => void;
	profilesScores: Record<string, number | null | undefined>;
	setProfilesScores: (
		scores: Record<string, number | null | undefined>,
	) => void;
	selectedProfileNodeId: string | null;
	setSelectedProfileNodeId: (id: string | null) => void;
	selectedProfileName: string | null;
	setSelectedProfileName: (name: string | null) => void;
}

interface ProjectSlice {
	projectName?: string;
	setProjectName: (name?: string) => void;
}

interface ColombusStore
	extends AuthSlice,
		DiffSlice,
		PatternSlice,
		GraphCustomizationSlice,
		ProfilesSlice,
		ProjectSlice {}

const createDiffSlice: StateCreator<ColombusStore, [], [], DiffSlice> = (
	set,
	get,
) => ({
	referenceDiffProfile: undefined,
	diffResults: [],
	setReferenceDiffProfile: async (p) => {
		/**
		 * Set the reference diff profile and query/update the results.
		 */
		const availableProfilesNames = get().availableProfilesNames;
		const diffResults = await postDiffSort([
			p,
			...availableProfilesNames.filter((n) => n !== p),
		]);
		set((state) => ({
			...state,
			referenceDiffProfile: p,
			diffResults,
			availableProfilesNames: diffResults.map((r) => r.profile_name),
			availableProfilesWithPpmData: diffResults.map(
				({ profile_name, results }) => ({ profile_name, results }),
			),
		}));
	},
	resetReferenceDiffProfile: () =>
		set((state) => ({
			...state,
			referenceDiffProfile: undefined,
			diffResults: [],
		})),
});

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
	patternAppendTrigger: undefined,
	setPatternAppendTrigger: (t) =>
		set((state) => ({ ...state, patternAppendTrigger: t })),
});

const createAuthSlice: StateCreator<ColombusStore, [], [], AuthSlice> = (
	set,
) => ({
	jwtToken: undefined,
	jwtExpiry: undefined,
	setJwtToken: (token, expiry) => {
		set((state) => ({ ...state, jwtToken: token, jwtExpiry: expiry }));
	},
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
	pathsDisplayMode: "show-variable",
	setPathsDisplayMode: (mode) =>
		set((state) => ({ ...state, pathsDisplayMode: mode })),
	scoreEvolutionFilter: 2,
	setScoreEvolutionFilter: (filter) =>
		set((state) => ({ ...state, scoreEvolutionFilter: filter })),
	useScoreEvolutionFilter: false,
	setUseScoreEvolutionFilter: (use) =>
		set((state) => ({ ...state, useScoreEvolutionFilter: use })),
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
	profilesScores: {},
	setProfilesScores: (scores) =>
		set((state) => ({ ...state, profilesScores: scores })),
	selectedProfileNodeId: null,
	setSelectedProfileNodeId: (id) =>
		set((state) => ({ ...state, selectedProfileNodeId: id })),
	selectedProfileName: null,
	setSelectedProfileName: (name) =>
		set((state) => ({ ...state, selectedProfileName: name })),
});

const createProjectSlice: StateCreator<ColombusStore, [], [], ProjectSlice> = (
	set,
) => ({
	projectName: undefined,
	setProjectName(name) {
		set((state) => ({ ...state, projectName: name }));
	},
});

export const useColombusStore = create<ColombusStore>()(
	devtools(
		persist(
			(...a) => ({
				...createAuthSlice(...a),
				...createDiffSlice(...a),
				...createPatternSlice(...a),
				...createGraphCustomizationSlice(...a),
				...createProfilesSlice(...a),
				...createProjectSlice(...a),
			}),
			{
				name: "colombus-storage",
			},
		),
	),
);
