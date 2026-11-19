import axios from "axios";
import type { KaggleNotebookList, PatternGroup, PpmResult } from "@/lib/types";
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

const API_KEY_HEADER_NAME = "x-jwt-token";

const baseURL = `${import.meta.env.BASE_URL}api`;

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

export type Project = { id: string; name: string };

export function getApiErrorMessage(err: any, fallback: string): string {
	const detail = err?.response?.data?.detail;
	if (typeof detail === "string" && detail !== "") {
		return detail;
	}
	if (Array.isArray(detail) && typeof detail[0]?.msg === "string") {
		return detail[0].msg;
	}
	if (
		err?.response === undefined &&
		typeof err?.message === "string" &&
		err.message !== ""
	) {
		return err.message;
	}
	return fallback;
}

export async function createNewProject(name: string) {
	return await axiosInstance
		.post<string>("/projects", {
			name,
		})
		.then(({ data }) => data);
}

export async function getAllProjects(signal?: AbortSignal) {
	return await axiosInstance
		.get<Project[]>("/projects", { signal })
		.then(({ data }) => data);
}

export async function renameProject(projectId: string, name: string) {
	return await axiosInstance
		.patch<string>(`/projects/${projectId}`, { name })
		.then(({ data }) => data);
}

export async function deleteProject(projectId: string) {
	await axiosInstance.delete(`/projects/${projectId}`);
}

export async function getGraphNodes(projectId: string, profileIds: string[]) {
	if (profileIds.length === 0) {
		return Promise.resolve<GraphDefinition[]>([]);
	}
	return await axiosInstance
		.post<GraphDefinition[]>(`/projects/${projectId}/profiles/nodes`, {
			ids: profileIds,
		})
		.then(({ data }) => data);
}

export type ProfileSummary = {
	id: string;
	name: string;
	score: number | null;
};

export type ProjectDetails = Project & { profiles: ProfileSummary[] };

export async function getProject(projectId: string) {
	return await axiosInstance
		.get<ProjectDetails>(`/projects/${projectId}`)
		.then(({ data }) => data);
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
		.post<string[]>(`/projects/${projectId}/profiles`, formData, {
			headers: {
				accept: "application/json",
				"Content-Type": "multipart/form-data",
			},
		})
		.then(({ data }) => data);
}

export async function getAllPatterns(projectId: string) {
	return await axiosInstance
		.get<Pattern[]>(`/projects/${projectId}/patterns`)
		.then(({ data }) => Pattern.array().parse(data));
}

export async function parsePpm(projectId: string, content: string) {
	return await axiosInstance
		.post<Pattern>(`/projects/${projectId}/patterns/parse`, {
			pattern_dsl: content,
		})
		.then(({ data }) => data);
}

export async function postApplyPpmFilter(
	projectId: string,
	pattern: PatternGroup[],
) {
	return await axiosInstance
		.post<PpmResult[]>(`/projects/${projectId}/patterns/execute`, pattern)
		.then(({ data }) => data);
}

export async function postApplyPpmFilterByName(
	projectId: string,
	name: string,
) {
	return await axiosInstance
		.post<PpmResult[]>(`/projects/${projectId}/patterns/${name}/execute`)
		.then(({ data }) => data);
}

export async function searchKaggleCompetitions(
	projectId: string,
	search: string,
) {
	return await axiosInstance
		.get<{ ref: string; title: string; description: string }[]>(
			`/projects/${projectId}/kaggle/competitions`,
			{ params: { search } },
		)
		.then(({ data }) => data);
}

export async function getKaggleStatus() {
	return await axiosInstance
		.get<{ available: boolean }>("/kaggle/status")
		.then(({ data }) => data.available);
}

export async function getKaggleCompetitionNotebooks(
	projectId: string,
	competition: string,
	pageToken?: string,
) {
	return await axiosInstance
		.get<KaggleNotebookList>(`/projects/${projectId}/kaggle/notebooks`, {
			params: { competition, page_token: pageToken },
		})
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
		.post<string[]>(`/projects/${projectId}/profiles/kaggle`, payload)
		.then(({ data }) => data);
}

export async function postSavePpm(projectId: string, pattern: Pattern) {
	return await axiosInstance
		.post<string>(`/projects/${projectId}/patterns`, pattern)
		.then(({ data }) => data);
}

export async function deletePpm(projectId: string, name: string) {
	return await axiosInstance.delete(`/projects/${projectId}/patterns/${name}`);
}

export async function getOutputImagesForStep(
	projectId: string,
	stepId: string,
) {
	return await axiosInstance
		.get<string[]>(`/projects/${projectId}/steps/${stepId}/outputs`)
		.then(({ data }) => data);
}

export async function postFrequentPatternsMatrixPlotly(
	projectId: string,
	profilesNames?: string[],
) {
	return await axiosInstance
		.post<any>(`/projects/${projectId}/stats/patterns`, {
			profiles_names: profilesNames,
		})
		.then(({ data }) => data);
}

export async function postFrequentStepsData(
	projectId: string,
	profilesNames?: string[],
) {
	return await axiosInstance
		.post<[string, number][]>(`/projects/${projectId}/stats/steps/frequency`, {
			profiles_names: profilesNames,
		})
		.then(({ data }) => data.map((d) => ({ step: d[0], frequency: d[1] })));
}

export async function getAuthConfig(): Promise<{
	auth_required: boolean;
	google_client_id: string;
}> {
	return await axiosInstance
		.get<{ auth_required: boolean; google_client_id: string }>("/auth/config")
		.then(({ data }) => data);
}

export async function authGoogle(credential: string) {
	return await axiosInstance
		.post<{ jwt_token: string; exp: number }>("/auth/google", { credential })
		.then(({ data }) => data);
}
