import { Pattern } from "@/lib/types";
import type { PatternGroup } from "@/lib/types";
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
export type PpmResult = {
	profile_name: string;
	results: string[][];
};

const apiPath = import.meta.env.VITE_API_HOST ?? "http://localhost";
const apiPort = import.meta.env.VITE_API_PORT ?? 8080;

export async function checkApiKey(apiKey: string) {
	return await axios
		.post<string>(`${apiPath}:${apiPort}/api/key`, {
			api_key: apiKey,
		})
		.then(({ data }) => data);
}

export async function createNewProject(name: string, apiKey: string) {
	return await axios
		.post<string>(`${apiPath}:${apiPort}/api/project`, {
			name,
			api_key: apiKey,
		})
		.then(({ data }) => data);
}

export async function postRetrieveProjectName(
	projectId: string,
	apiKey: string,
) {
	return await axios
		.post<string>(`${apiPath}:${apiPort}/api/project/${projectId}/details`, {
			api_key: apiKey,
		})
		.then(({ data }) => data);
}

export async function getGraphNodes(
	projectId: string,
	profilesNames?: string[],
) {
	if (profilesNames?.length === 0) {
		return Promise.resolve<GraphDefinition[]>([]);
	}
	return await axios
		.get<GraphDefinition[]>(
			`${apiPath}:${apiPort}/api/project/${projectId}/profile/nodes`,
			{
				params: {
					names: profilesNames,
				},
				paramsSerializer: {
					indexes: null,
				},
			},
		)
		.then(({ data }) => data);
}

export async function getAllProfiles(projectId: string) {
	return await axios
		.get<string[]>(
			`${apiPath}:${apiPort}/api/project/${projectId}/profile/getAll`,
		)
		.then(({ data }) => data);
}

export async function postProfiles(projectId: string, files: File[]) {
	const formData = new FormData();
	for (const file of files) {
		formData.append("profile_files", file);
	}
	return await axios
		.post<string[]>(
			`${apiPath}:${apiPort}/api/project/${projectId}/profile/import/multiple`,
			formData,
			{
				headers: {
					accept: "application/json",
					"Content-Type": "multipart/form-data",
				},
			},
		)
		.then(({ data }) => data);
}

export async function getAllPatterns(projectId: string) {
	return await axios
		.get<Pattern[]>(`${apiPath}:${apiPort}/api/project/${projectId}/ppm/getAll`)
		.then(({ data }) => Pattern.array().parse(data));
}

export async function postApplyPpmFilter(
	projectId: string,
	pattern: PatternGroup[],
) {
	return await axios
		.post<PpmResult[]>(
			`${apiPath}:${apiPort}/api/project/${projectId}/ppm/execute`,
			pattern,
		)
		.then(({ data }) => data);
}

export async function postApplyPpmFilterByName(
	projectId: string,
	name: string,
) {
	return await axios
		.post<PpmResult[]>(
			`${apiPath}:${apiPort}/api/project/${projectId}/ppm/execute/${name}`,
		)
		.then(({ data }) => data);
}

export async function postSavePpm(
	projectId: string,
	name: string,
	pattern: Pattern,
) {
	return await axios
		.post<string>(
			`${apiPath}:${apiPort}/api/project/${projectId}/ppm/save/${name}`,
			pattern,
		)
		.then(({ data }) => data);
}

export async function deletePpm(projectId: string, name: string) {
	return await axios.delete(
		`${apiPath}:${apiPort}/api/project/${projectId}/ppm/delete/${name}`,
	);
}
