import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useGraph from "@/useGraph";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./components/ui/button";

const config = {
	headers: { Authorization: `Basic ${btoa("neo4j:pinta_nina")}` },
};

async function getNodesFromNeo4J(workflowNames: string[]) {
	return await axios.post(
		"http://localhost:7474/db/neo4j/query/v2",
		{
			statement: `MATCH (w:Workflow)-[wsa]->(sa:Stage)-[sase]->(se:Step)-[sem]->(m:MetaInstruction)-[mc]->(c:Code) OPTIONAL MATCH (sa)-[sasp:PRECEDES]->(:Stage) OPTIONAL MATCH (se)-[sesp:PRECEDES]->(:Step) OPTIONAL MATCH (m)-[mp:PRECEDES]->(:MetaInstruction) OPTIONAL MATCH (c)-[cp:PRECEDES]->(:Code) WHERE ANY (name in w.name WHERE name IN ${JSON.stringify(workflowNames)}) RETURN w, sa, se, m, c, wsa, sase, sem, mc, sasp, sesp, mp, cp`,
		},
		config,
	);
}

async function postProfiles(files: File[]) {
	const formData = new FormData();
	for (const file of files) {
		formData.append("profile_files", file);
	}
	return await axios.post(
		"http://localhost:8080/api/profile/import/multiple",
		formData,
		{
			headers: {
				...config.headers,
				accept: "application/json",
				"Content-Type": "multipart/form-data",
			},
		},
	);
}

async function postPpmFilter(file: File) {
	const formData = new FormData();
	formData.append("ppm_file", file);
	return await axios.post("http://localhost:8080/api/ppm/execute", formData, {
		headers: {
			...config.headers,
			accept: "application/json",
			"Content-Type": "multipart/form-data",
		},
	});
}

export default function App() {
	const [graphContainerId, setGraphContainerId] = useState<
		string | undefined
	>();
	const [filteredWorkflowsNodes, setFilteredWorkflowsNodes] = useState<
		unknown[] | undefined
	>();
	const [allWorkflows, setAllWorkflows] = useState<string[] | undefined>();
	const [filteredWorkflows, setFilteredWorkflows] = useState<
		string[] | undefined
	>();

	useGraph(graphContainerId, filteredWorkflowsNodes?.data, filteredWorkflows);

	const handleProfileFormSubmit = async (e) => {
		e.preventDefault();
		await postProfiles(e.target[0].files).then(() =>
			toast("Profile(s) successfuly imported."),
		);
	};

	const handlePpmFormSubmit = async (e) => {
		e.preventDefault();
		const res = await postPpmFilter(e.target[0].files[0]);
		setAllWorkflows(res.data);
		setFilteredWorkflows(res.data);
		await getNodesFromNeo4J(res.data).then((r) =>
			setFilteredWorkflowsNodes(r.data),
		);
	};

	useEffect(() => {
		setGraphContainerId("graph-container");
	}, []);

	return (
		<main className="">
			<div className="grid grid-rows-2">
				<div className="flex flex-col items-center justify-center pt-16">
					<h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
						Colombus 🌄
					</h1>
					<div className="flex flex-col py-10 space-y-4">
						<form onSubmit={handleProfileFormSubmit}>
							<div className="grid w-full max-w-sm items-center gap-1.5">
								<Label htmlFor="profile-form">
									Import a new profile (JSON)
								</Label>
								<Input id="profile-form" type="file" accept=".json" multiple name="profile-form" />
								<Button type="submit">Submit Profile</Button>
							</div>
						</form>
						<form onSubmit={handlePpmFormSubmit}>
							<div className="grid w-full max-w-sm items-center gap-1.5">
								<Label htmlFor="ppm-form">
									Select a pattern to apply (JSON)
								</Label>
								<Input id="ppm-form" type="file" accept=".json" name="ppm-form" />
								<Button type="submit">Submit PPM filter</Button>
							</div>
						</form>
					</div>
				</div>
				<div className="grid grid-cols-6">
					<div className="col-span-1">
						{allWorkflows && (
							<div>
								<p>
									<b>Results:</b>
								</p>
								{allWorkflows.map((w) => (
									<div className="items-top flex space-x-2" key={w}>
										<Checkbox
											id={`cb_${w}`}
											checked={filteredWorkflows?.includes(w)}
											onCheckedChange={(c) => {
												if (!filteredWorkflows) {
													return;
												}
												setFilteredWorkflows(
													c
														? [...filteredWorkflows, w]
														: filteredWorkflows.filter((fw) => fw !== w),
												);
											}}
										/>
										<div className="grid gap-1.5 leading-none">
											<label
												htmlFor={`cb_${w}`}
												className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											>
												{w}
											</label>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
					<div
						className="col-span-5"
						id="graph-container"
						style={{ height: "90%", width: "100%" }}
					/>
				</div>
			</div>
		</main>
	);
}
