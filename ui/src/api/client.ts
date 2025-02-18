import type { PatternElement } from "@/lib/types";
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

export async function getGraphNodes(profilesNames?: string[]) {
	if (profilesNames?.length === 0) {
		return Promise.resolve<GraphDefinition[]>([]);
	}
	return await axios
		.get<GraphDefinition[]>(`${apiPath}:${apiPort}/api/profile/nodes`, {
			params: {
				names: profilesNames,
			},
			paramsSerializer: {
				indexes: null,
			},
		})
		.then(({ data }) => data);
}

export async function getAllProfiles() {
	return await axios
		.get<string[]>(`${apiPath}:${apiPort}/api/profile/getAll`)
		.then(({ data }) => data);
}

export async function postProfiles(files: FileList) {
	const formData = new FormData();
	for (const file of files) {
		formData.append("profile_files", file);
	}
	return await axios
		.post<string[]>(
			`${apiPath}:${apiPort}/api/profile/import/multiple`,
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

export async function getAllPatterns() {
	return await axios
		.get<[string, PatternElement[]][]>(`${apiPath}:${apiPort}/api/ppm/getAll`)
		.then(({ data }) => data);
}

export async function postApplyPpmFilter(pattern: PatternElement[]) {
	return await axios
		.post<PpmResult[]>(`${apiPath}:${apiPort}/api/ppm/execute`, pattern)
		.then(({ data }) => data);
}

export async function postApplyPpmFilterByName(name: string) {
	return await axios
		.post<PpmResult[]>(`${apiPath}:${apiPort}/api/ppm/execute/${name}`)
		.then(({ data }) => data);
}

export async function postSavePpm(name: string, pattern: PatternElement[]) {
	return await axios
		.post<string>(`${apiPath}:${apiPort}/api/ppm/save/${name}`, pattern)
		.then(({ data }) => data);
}

export async function deletePpm(name: string) {
	return await axios.delete(`${apiPath}:${apiPort}/api/ppm/delete/${name}`);
}
