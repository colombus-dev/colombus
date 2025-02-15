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

export async function getGraphNodes(profilesNames?: string[]) {
	if (profilesNames?.length === 0) {
		return Promise.resolve<GraphDefinition[]>([]);
	}
	return await axios
		.get<GraphDefinition[]>("http://localhost:8080/api/profile/nodes", {
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
		.get<string[]>("http://localhost:8080/api/profile/getAll")
		.then(({ data }) => data);
}

export async function postProfiles(files: FileList) {
	const formData = new FormData();
	for (const file of files) {
		formData.append("profile_files", file);
	}
	return await axios
		.post<string[]>(
			"http://localhost:8080/api/profile/import/multiple",
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
		.get<[string, PatternElement[]][]>("http://localhost:8080/api/ppm/getAll")
		.then(({ data }) => data);
}

export async function postApplyPpmFilter(pattern: PatternElement[]) {
	return await axios
		.post<PpmResult[]>("http://localhost:8080/api/ppm/execute", pattern)
		.then(({ data }) => data);
}

export async function postApplyPpmFilterByName(name: string) {
	return await axios
		.post<PpmResult[]>(`http://localhost:8080/api/ppm/execute/${name}`)
		.then(({ data }) => data);
}

export async function postSavePpm(name: string, pattern: PatternElement[]) {
	return await axios
		.post<string>(`http://localhost:8080/api/ppm/save/${name}`, pattern)
		.then(({ data }) => data);
}

export async function deletePpm(name: string) {
	return await axios.delete(`http://localhost:8080/api/ppm/delete/${name}`);
}
