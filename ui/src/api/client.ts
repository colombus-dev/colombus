import axios from "axios";
import type { DiffResult, PatternGroup, PpmResult } from "@/lib/types";
import { Pattern } from "@/lib/types";
import { useColombusStore } from "@/store";

export type StepNode = {
	id: string;
	name: string;
	position: number;
	number_children: number;
};
export type MetaInstructionNode = {
	id: string;
	step_id: string;
	algoFamily: string;
	algoName: string;
	library: string;
	function: string;
	position: number;
	number_children: number;
};
export type CodeNode = {
	id: string;
	meta_instruction_id: string;
	content: string;
	position: number;
};
export type GraphDefinition = {
	id: string;
	name: string;
	steps: StepNode[];
	meta_instructions: MetaInstructionNode[];
	codes: CodeNode[];
};
export const ProfileFileExtension = ".json";
export const NotebookFileExtension = ".ipynb";

const API_KEY_HEADER_NAME = "x-api-key";

const baseURL = `${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api`;

const axiosInstance = axios.create({
	baseURL,
});

axiosInstance.interceptors.request.use((config) => {
	const token = useColombusStore.getState().jwtToken;
	if (token) {
		config.headers[API_KEY_HEADER_NAME] = token;
	}
	return config;
});

axiosInstance.interceptors.response.use(
	(r) => r,
	(error) => {
		if (error.response?.status === 401) {
			useColombusStore.getState().setJwtToken(undefined);
		}
		return Promise.reject(error);
	},
);

export async function createNewProject(name: string) {
	return await axiosInstance
		.post<string>("/project", {
			name,
		})
		.then(({ data }) => data);
}

export async function getAllProjects() {
	return await axiosInstance
		.get<{ id: string; name: string }[]>("/project")
		.then(({ data }) => data);
}

export async function postRetrieveProjectName(projectId: string) {
	return await axiosInstance
		.post<string>(`/project/${projectId}/details`)
		.then(({ data }) => data);
}

export async function getGraphNodes(
	projectId: string,
	profilesNames?: string[],
) {
	if (profilesNames?.length === 0) {
		return Promise.resolve<GraphDefinition[]>([]);
	}
	return await axiosInstance
		.get<GraphDefinition[]>(`/project/${projectId}/profile/nodes`, {
			params: {
				names: profilesNames,
			},
			paramsSerializer: {
				indexes: null,
			},
		})
		.then(({ data }) => data);
}

export async function getAllProfiles(projectId: string) {
	return await axiosInstance
		.get<string[]>(`/project/${projectId}/profile/getAll`)
		.then(({ data }) => data);
}

export async function getProfilesScores(projectId: string) {
	const response = await axiosInstance.get<Record<string, number | null>>(
		`/project/${projectId}/profile/scores`,
	);
	return response.data;
}

export async function postNotebookOrProfiles(projectId: string, files: File[]) {
	const formData = new FormData();
	for (const file of files)
		file.name.endsWith(ProfileFileExtension)
			? formData.append("profile_files", file)
			: file.name.endsWith(NotebookFileExtension)
				? formData.append("notebook_files", file)
				: console.assert("Failed to upload unknown file type {file.name}");
	return await axiosInstance
		.post<string[]>(`/project/${projectId}/profile/import`, formData, {
			headers: {
				accept: "application/json",
				"Content-Type": "multipart/form-data",
			},
		})
		.then(({ data }) => data);
}

export async function getAllPatterns(projectId: string) {
	return await axiosInstance
		.get<Pattern[]>(`/project/${projectId}/ppm/getAll`)
		.then(({ data }) => Pattern.array().parse(data));
}

export async function parsePpm(projectId: string, content: string) {
	return await axiosInstance
		.post<Pattern>(`/project/${projectId}/ppm/parse`, {
			pattern_dsl: content,
		})
		.then(({ data }) => data);
}

export async function postApplyPpmFilter(
	projectId: string,
	pattern: PatternGroup[],
) {
	return await axiosInstance
		.post<PpmResult[]>(`/project/${projectId}/ppm/execute`, pattern)
		.then(({ data }) => data);
}

export async function postApplyPpmFilterByName(
	projectId: string,
	name: string,
) {
	return await axiosInstance
		.post<PpmResult[]>(`/project/${projectId}/ppm/execute/${name}`)
		.then(({ data }) => data);
}

export async function searchKaggleCompetitions(
	projectId: string,
	search: string,
) {
	return await axiosInstance
		.get<{ ref: string; title: string; description: string }[]>(
			`/project/${projectId}/profile/kaggle/competitions`,
			{ params: { search } },
		)
		.then(({ data }) => data);
}

export async function getKaggleCompetitionNotebooks(
	projectId: string,
	competition: string,
) {
	return await axiosInstance
		.get<
			{ ref: string; title: string; author: string; score?: number | null }[]
		>(`/project/${projectId}/profile/kaggle/list`, { params: { competition } })
		.then(({ data }) => data);
}

export async function postImportKaggle(
	projectId: string,
	payload: {
		competition?: string;
		slugs?: string[];
		scores?: Record<string, number>;
	},
) {
	return await axiosInstance
		.post<string[]>(`/project/${projectId}/profile/import/kaggle`, payload)
		.then(({ data }) => data);
}

export async function postSavePpm(projectId: string, pattern: Pattern) {
	return await axiosInstance
		.post<string>(`/project/${projectId}/ppm/save`, pattern)
		.then(({ data }) => data);
}

export async function deletePpm(projectId: string, name: string) {
	return await axiosInstance.delete(`/project/${projectId}/ppm/delete/${name}`);
}

export async function getOutputImagesForStep(
	projectId: string,
	stepId: string,
) {
	return await axiosInstance
		.get<string[]>(`/project/${projectId}/profile/step/${stepId}/output`)
		.then(({ data }) => data);
}

export async function postDiffSort(profiles: string[]) {
	return await axiosInstance
		.post<DiffResult[]>("/utils/diff/sort", {
			profiles_to_diff: profiles,
		})
		.then(({ data }) => data);
}

export async function postFrequentPatternsMatrixPlotly(
	projectId: string,
	profilesNames?: string[],
) {
	return await axiosInstance
		.post<any>(`/project/${projectId}/stats/patterns`, {
			profiles_names: profilesNames,
		})
		.then(({ data }) => data);
}

export async function postFrequentStepsData(
	projectId: string,
	profilesNames?: string[],
) {
	return await axiosInstance
		.post<[string, number][]>(`/project/${projectId}/stats/steps/frequency`, {
			profiles_names: profilesNames,
		})
		.then(({ data }) => data.map((d) => ({ step: d[0], frequency: d[1] })));
}

export async function getAuthConfig(): Promise<string> {
	return await axiosInstance
		.get<{ google_client_id: string }>("/auth/config")
		.then(({ data }) => data.google_client_id);
}

export async function authGoogle(credential: string) {
	return await axiosInstance
		.post<{ jwt_token: string; exp: number }>("/auth/google", { credential })
		.then(({ data }) => data);
}
