import type { StateCreator } from "zustand";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { PpmNodesDisplayMode } from "@/configuration";
import type { Pattern, PpmResult } from "@/lib/types";

interface AuthSlice {
	jwtToken?: string;
	jwtExpiry?: number;
	setJwtToken: (token: string | undefined, expiry?: number) => void;
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
	availableProfileIds: string[];
	setAvailableProfileIds: (profiles: string[]) => void;
	availableProfilesWithPpmData: PpmResult[];
	setAvailableProfilesWithPpmData: (data: PpmResult[]) => void;
	filteredProfileIds: string[];
	setFilteredProfileIds: (profiles: string[]) => void;
	profilesScores: Record<string, number | null | undefined>;
	setProfilesScores: (
		scores: Record<string, number | null | undefined>,
	) => void;
	selectedProfileNodeId: string | null;
	setSelectedProfileNodeId: (id: string | null) => void;
	selectedProfileId: string | null;
	setSelectedProfileId: (id: string | null) => void;
	profilesNames: Record<string, string>;
	setProfilesNames: (names: Record<string, string>) => void;
}

interface ProjectSlice {
	projectName?: string;
	setProjectName: (name?: string) => void;
	resetProjectState: () => void;
}

interface ColombusStore
	extends AuthSlice,
		PatternSlice,
		GraphCustomizationSlice,
		ProfilesSlice,
		ProjectSlice {}

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
	patternCapturedNodesDisplayMode: "show-variable",
	setPatternCapturedNodesDisplayMode: (mode) =>
		set((state) => ({ ...state, patternCapturedNodesDisplayMode: mode })),
});

const createProfilesSlice: StateCreator<
	ColombusStore,
	[],
	[],
	ProfilesSlice
> = (set) => ({
	availableProfileIds: [],
	setAvailableProfileIds: (profiles) =>
		set((state) => ({ ...state, availableProfileIds: profiles })),
	availableProfilesWithPpmData: [],
	setAvailableProfilesWithPpmData: (data) =>
		set((state) => ({ ...state, availableProfilesWithPpmData: data })),
	filteredProfileIds: [],
	setFilteredProfileIds: (profiles) =>
		set((state) => ({ ...state, filteredProfileIds: profiles })),
	profilesScores: {},
	setProfilesScores: (scores) =>
		set((state) => ({ ...state, profilesScores: scores })),
	selectedProfileNodeId: null,
	setSelectedProfileNodeId: (id) =>
		set((state) => ({ ...state, selectedProfileNodeId: id })),
	selectedProfileId: null,
	setSelectedProfileId: (id) =>
		set((state) => ({ ...state, selectedProfileId: id })),
	profilesNames: {},
	setProfilesNames: (names) =>
		set((state) => ({ ...state, profilesNames: names })),
});

const createProjectSlice: StateCreator<ColombusStore, [], [], ProjectSlice> = (
	set,
) => ({
	projectName: undefined,
	setProjectName(name) {
		set((state) => ({ ...state, projectName: name }));
	},
	resetProjectState: () =>
		set((state) => ({
			...state,
			projectName: undefined,
			currentPattern: undefined,
			allSavedPatterns: [],
			availableProfileIds: [],
			availableProfilesWithPpmData: [],
			filteredProfileIds: [],
			profilesScores: {},
			selectedProfileNodeId: null,
			selectedProfileId: null,
			profilesNames: {},
		})),
});

const PERSISTED_KEYS = [
	"jwtToken",
	"jwtExpiry",
	"displayedLevel",
	"useWeightedNodes",
	"patternCapturedNodesDisplayMode",
] as const;

type PersistedState = Partial<
	Pick<ColombusStore, (typeof PERSISTED_KEYS)[number]>
>;

const persistedState = (state: PersistedState): PersistedState =>
	Object.fromEntries(
		PERSISTED_KEYS.filter((key) => state[key] !== undefined).map((key) => [
			key,
			state[key],
		]),
	);

export const useColombusStore = create<ColombusStore>()(
	devtools(
		persist(
			(...a) => ({
				...createAuthSlice(...a),
				...createPatternSlice(...a),
				...createGraphCustomizationSlice(...a),
				...createProfilesSlice(...a),
				...createProjectSlice(...a),
			}),
			{
				name: "colombus-storage",
				version: 1,
				partialize: (state) => persistedState(state),
				migrate: (stored) => persistedState(stored as PersistedState),
			},
		),
	),
);
