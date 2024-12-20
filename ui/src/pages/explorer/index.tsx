import {
	type Neo4JGraphDefinition,
	getAllProfiles,
	getNodesFromNeo4J,
	postPpmFilter,
	postProfiles,
} from "@/api/client";
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
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ExplorerPage() {
	const [graphContainerId, setGraphContainerId] = useState<
		string | undefined
	>();
	const [filteredWorkflowsNodes, setFilteredWorkflowsNodes] = useState<
		Neo4JGraphDefinition | undefined
	>();
	const [allWorkflows, setAllWorkflows] = useState<string[] | undefined>();
	const [filteredWorkflows, setFilteredWorkflows] = useState<
		string[] | undefined
	>();
	const [displayedLevel, setDisplayedLevel] = useState<number>(3); // default display to step
	const [currentPpm, setCurrentPpm] = useState<File | undefined>();
	const [postedProfiles, setPostedProfiles] = useState<string[] | undefined>();

	useGraph(
		graphContainerId,
		filteredWorkflowsNodes,
		filteredWorkflows,
		displayedLevel,
	);

	useEffect(() => {
		const updateAndMergeWithPosted = async (workflows: string[]) => {
			setAllWorkflows(workflows);
			// we prioritize newly posted profiles
			const reducedWorkflows = new Set(postedProfiles).union(
				new Set(workflows.slice(0, 5)),
			);
			setFilteredWorkflows([...reducedWorkflows]);
			await getNodesFromNeo4J(workflows).then((r) =>
				setFilteredWorkflowsNodes(r),
			);
		};
		// TODO: solve double query issue
		if (currentPpm) {
			postPpmFilter(currentPpm).then(updateAndMergeWithPosted);
		} else {
			getAllProfiles().then(updateAndMergeWithPosted);
		}
	}, [currentPpm, postedProfiles]);

	const handlePpmFormSubmit: React.FormEventHandler<HTMLFormElement> =
		useCallback(async (e) => {
			e.preventDefault();
			const files = ((e.target as HTMLFormElement)[0] as HTMLInputElement)
				.files;
			if (!files) {
				return;
			}
			setCurrentPpm(files[0]);
		}, []);

	const handleProfileFormSubmit: React.FormEventHandler<HTMLFormElement> =
		useCallback(async (e) => {
			e.preventDefault();
			const files = ((e.target as HTMLFormElement)[0] as HTMLInputElement)
				.files;
			if (!files) {
				return;
			}
			await postProfiles(files).then((r) => {
				toast("Profile(s) successfuly imported.");
				setPostedProfiles(r);
			});
		}, []);

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
