import { Pattern } from "@/lib/types";
import type { DiffResult, PatternGroup, PpmResult } from "@/lib/types";
import { useColombusStore } from "@/store";
import axios from "axios";

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

const apiPath = import.meta.env.VITE_API_HOST ?? "http://localhost";
const apiPort = import.meta.env.VITE_API_PORT ?? 8180;

const API_KEY_HEADER_NAME = "x-api-key";

const axiosInstance = axios.create({
	baseURL: `${apiPath}:${apiPort}/api`,
	headers: {
		common: {
			[API_KEY_HEADER_NAME]: useColombusStore.getState().apiKey,
		},
	},
});

export function updateHttpClientApiKey() {
	axiosInstance.defaults.headers.common[API_KEY_HEADER_NAME] =
		useColombusStore.getState().apiKey;
}

export async function checkApiKey(apiKey: string) {
	return await axiosInstance
		.post<string>(`/key`, undefined, {
			headers: { [API_KEY_HEADER_NAME]: apiKey },
		})
		.then(({ data }) => data);
}

export async function createNewProject(name: string) {
	return await axiosInstance
		.post<string>(`/project`, {
			name,
		})
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

export async function postProfiles(projectId: string, files: File[]) {
	const formData = new FormData();
	for (const file of files) {
		formData.append("profile_files", file);
	}
	return await axiosInstance
		.post<string[]>(`/project/${projectId}/profile/import/multiple`, formData, {
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

export async function postSavePpm(
	projectId: string,
	name: string,
	pattern: Pattern,
) {
	return await axiosInstance
		.post<string>(`/project/${projectId}/ppm/save/${name}`, pattern)
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
		.post<DiffResult[]>(`/utils/diff/sort`, {
			profiles_to_diff: profiles,
		})
		.then(({ data }) => data);
}

export async function postFrequentPatternsMatrixImage(
	projectId: string,
	profilesNames?: string[],
) {
	return await axiosInstance
		.post(
			`/project/${projectId}/stats/patterns`,
			{
				profiles_names: profilesNames,
			},
			{
				responseType: "arraybuffer",
			},
		)
		// TODO: to improve
		// @ts-ignore: to improve
		.then(({ data }) =>
			btoa(
				[].reduce.call(
					new Uint8Array(data),
					(p, c) => p + String.fromCharCode(c),
					"",
				),
			),
		);
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
