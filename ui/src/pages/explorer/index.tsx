import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import useGraph from "@/useGraph";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const config = {
	headers: { Authorization: `Basic ${btoa("neo4j:pinta_nina")}` },
};

async function getNodesFromNeo4J(workflowNames?: string[]) {
	if (workflowNames?.length === 0) {
		return;
	}
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

async function getAllProfiles() {
	return await axios.post("http://localhost:8080/api/profile/getAll");
}

export default function ExplorerPage() {
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
	const [displayedLevel, setDisplayedLevel] = useState<number>(3); // default display to step
	const [currentPpm, setCurrentPpm] = useState<File | undefined>();
	const [postedProfiles, setPostedProfiles] = useState<File | undefined>();

	useGraph(
		graphContainerId,
		filteredWorkflowsNodes?.data,
		filteredWorkflows,
		displayedLevel,
	);

	const handlePpmFormSubmit = async (e) => {
		e.preventDefault();
		setCurrentPpm(e.target[0].files[0]);
	};

	useEffect(() => {
		// TODO: solve double query issue
		if (currentPpm) {
			postPpmFilter(currentPpm).then(async (res) => {
				setAllWorkflows(res.data);
				setFilteredWorkflows(res.data.slice(0, 5));
				await getNodesFromNeo4J(res.data).then((r) =>
					setFilteredWorkflowsNodes(r.data),
				);
			});
		} else {
			getAllProfiles().then(async (allProfiles) => {
				setAllWorkflows(allProfiles.data);
				setFilteredWorkflows(allProfiles.data.slice(0, 5));
				await getNodesFromNeo4J(allProfiles.data).then((r) =>
					setFilteredWorkflowsNodes(r.data),
				);
			});
		}
	}, [currentPpm, postedProfiles]);

	const handleProfileFormSubmit = async (e) => {
		e.preventDefault();
		await postProfiles(e.target[0].files).then((r) => {
			toast("Profile(s) successfuly imported.");
			setPostedProfiles(r);
		});
	};

	useEffect(() => {
		setGraphContainerId("graph-container");
	}, []);

	return (
		<section className="grid grid-cols-6 space-x-4 h-full">
			<div className="col-span-1">
				<div className="p-4 space-y-4">
					<form onSubmit={handleProfileFormSubmit}>
						<div className="grid w-full max-w-sm items-center gap-1.5">
							<Label htmlFor="profile-form">Import a new profile (JSON)</Label>
							<Input
								id="profile-form"
								type="file"
								accept=".json"
								multiple
								name="profile-form"
							/>
							<Button type="submit">Submit Profile</Button>
						</div>
					</form>
					<form onSubmit={handlePpmFormSubmit}>
						<div className="grid w-full max-w-sm items-center gap-1.5">
							<Label htmlFor="ppm-form">Select a pattern to apply (JSON)</Label>
							<Input id="ppm-form" type="file" accept=".json" name="ppm-form" />
							<Button type="submit">Submit PPM filter</Button>
						</div>
					</form>
				</div>
				{allWorkflows && (
					<div className="p-4 space-y-2">
						<p className="font-bold">Displayed levels:</p>
						<Select
							onValueChange={(v) => setDisplayedLevel(Number.parseInt(v))}
							defaultValue="3"
						>
							<SelectTrigger>
								<SelectValue placeholder="Level to display" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1">Workflow</SelectItem>
								<SelectItem value="2">Stage</SelectItem>
								<SelectItem value="3">Step</SelectItem>
								<SelectItem value="4">MetaInstruction</SelectItem>
								<SelectItem value="5">Code</SelectItem>
							</SelectContent>
						</Select>
						<p className="font-bold">Results:</p>
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
				className="col-span-5 border-gray-500 border"
				id="graph-container"
				style={{ height: "99%", width: "98%" }}
			/>
		</section>
	);
}
