import axios from "axios";

const config = {
	headers: { Authorization: `Basic ${btoa("neo4j:pinta_nina")}` },
};

export type Neo4jNodeProperties = {
	name?: string; // if step or workflow root
	library?: string; // if metainstruction
	function?: string; // if metainstruction
	content?: string; // if code
	cross_db_uuid?: string;
	numberRelatedSteps?: number;
	numberRelatedMetaInstructions?: number;
	position?: number;
};

export type Neo4JNode = {
	elementId: string;
	labels: string[];
	properties: Neo4jNodeProperties;
};

export type Neo4JEdge = {
	elementId: string;
	startNodeElementId: string;
	endNodeElementId: string;
	properties: unknown;
	type: string;
};

export type Neo4JGraphDefinition = (Neo4JNode | Neo4JEdge)[][];

export interface GetNodesFromNeo4JResponse {
	bookmarks: string[];
	data: {
		fields: string[];
		values: Neo4JGraphDefinition;
	};
}

export async function getNodesFromNeo4J(profilesNames?: string[]) {
	if (profilesNames?.length === 0) {
		return new Promise<Neo4JGraphDefinition>(() => [] as Neo4JGraphDefinition);
	}
	return await axios
		.post<GetNodesFromNeo4JResponse>(
			"http://localhost:7474/db/neo4j/query/v2",
			{
				statement: `MATCH (p:Profile)-[pse]->(se:Step)-[sem]->(m:MetaInstruction)-[mc]->(c:Code) OPTIONAL MATCH (se)-[sesp:PRECEDES]->(:Step) OPTIONAL MATCH (m)-[mp:PRECEDES]->(:MetaInstruction) OPTIONAL MATCH (c)-[cp:PRECEDES]->(:Code) WHERE ANY (name in p.name WHERE name IN ${JSON.stringify(profilesNames)}) RETURN p, se, m, c, pse, sem, mc, sesp, mp, cp ORDER BY p DESC, se.position DESC, m.position DESC, c.position DESC`,
			},
			config,
		)
		.then(
			({
				data: {
					data: { values },
				},
			}) => values,
		);
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
					...config.headers,
					accept: "application/json",
					"Content-Type": "multipart/form-data",
				},
			},
		)
		.then(({ data }) => data);
}

export async function postPpmFilter(file: File) {
	const formData = new FormData();
	formData.append("ppm_file", file);
	return await axios
		.post<string[][]>("http://localhost:8080/api/ppm/execute", formData, {
			headers: {
				...config.headers,
				accept: "application/json",
				"Content-Type": "multipart/form-data",
			},
		})
		.then(({ data }) => data);
}

export async function getAllProfiles() {
	return await axios
		.get<string[]>("http://localhost:8080/api/profile/getAll")
		.then(({ data }) => data);
}
