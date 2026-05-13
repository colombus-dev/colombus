import type { StateCreator } from "zustand";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { postDiffSort, updateHttpClientApiKey } from "@/api/client";
import type { PpmNodesDisplayMode } from "@/configuration";
import type { DiffResult, Pattern, PpmResult } from "@/lib/types";

export interface ProjectItem {
	id: string;
	name: string;
	branch: string;
	description: string;
}

interface AuthSlice {
	apiKey?: string;
	setApiKey: (key: string) => void;
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
	resetProjectScopedState: () => void;
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

interface ProjectSlice {
	projectId?: string;
	projectName?: string;
	projects: ProjectItem[];
	setProjectId: (id?: string) => void;
	setProjectName: (name?: string) => void;
	setProjects: (projects: ProjectItem[]) => void;
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
	resetProjectScopedState: () =>
		set((state) => ({
			...state,
			currentPattern: undefined,
			allSavedPatterns: [],
			referenceDiffProfile: undefined,
			diffResults: [],
			availableProfilesNames: [],
			availableProfilesWithPpmData: [],
			filteredProfilesNames: [],
		})),
});

const createAuthSlice: StateCreator<ColombusStore, [], [], AuthSlice> = (
	set,
) => ({
	apiKey: undefined,
	setApiKey: (k) => {
		set((state) => ({ ...state, apiKey: k }));
		updateHttpClientApiKey();
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

const createProjectSlice: StateCreator<ColombusStore, [], [], ProjectSlice> = (
	set,
) => ({
	projectId: undefined,
	projectName: undefined,
	projects: [
		{
			id: 'reusable-workspace',
			name: 'Reusable workspace',
			branch: 'main',
			description: 'Main project workspace for data analysis.',
		},
		{
			id: 'legacy-analysis',
			name: 'Legacy Analysis',
			branch: 'v1-archive',
			description: 'Archived project from previous quarter.',
		},
		{
			id: 'ml-experiments',
			name: 'ML Experiments',
			branch: 'feat/models',
			description: 'Testing new machine learning models.',
		},
	],
	setProjectId(id) {
		set((state) => ({ ...state, projectId: id }));
	},
	setProjectName(name) {
		set((state) => ({ ...state, projectName: name }));
	},
	setProjects(projects) {
		set((state) => ({ ...state, projects }));
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
