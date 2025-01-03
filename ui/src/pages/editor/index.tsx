import { Button, buttonVariants } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SelectSeparator } from "@radix-ui/react-select";
import Graph from "graphology";
import { CircleX, Download, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Sigma from "sigma";

const supportedStages = [
	"Library Loading",
	"Visualization",
	"Data Preparation",
	"Feature Engineering",
	"Model Building and Training",
	"Others",
];
const specialStages = ["*"];

export default function EditorPage() {
	const graph = useRef<Graph>(new Graph());
	const renderer = useRef<Sigma | undefined>();
	const [selectedStages, setSelectedStages] = useState<string[]>([]);

	const [containerId, setContainerId] = useState<string | undefined>();

	useEffect(() => {
		if (containerId) {
			renderer.current?.kill();
			const graphContainer = document.getElementById("graph-container");
			if (graphContainer) {
				renderer.current = new Sigma(graph.current, graphContainer);
			}
		}
	}, [containerId]);

	useEffect(() => {
		setContainerId("graph-container");
		return () => {
			renderer.current?.kill();
		};
	}, []);

	const jsonPattern = useMemo(
		() => selectedStages.map((s) => ({ name: s, tasks: ["*"] })),
		[selectedStages],
	);

	return (
		<section className="grid grid-row-6 space-x-4 h-full">
			<div className="row-span-2 flex">
				{[...Array(selectedStages.length + 1).keys()].map((p) => (
					<div key={p} className="flex items-stretch">
						<Select
							onValueChange={(v) =>
								setSelectedStages((prev) => {
									console.log(v);
									const newStages = [...prev];
									const [strStageIndex, stageName] = v.split("_");
									const stageIndex = Number.parseInt(strStageIndex);
									if (stageName === "remove") {
										// TODO
										// newStages.splice(stageIndex, 1);
									} else {
										newStages[stageIndex] = stageName;
									}
									return newStages;
								})
							}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Select stage..." />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel className="-ml-2 text-xs">Stages</SelectLabel>
									{supportedStages.map((s) => (
										<SelectItem key={`${p}_${s}`} value={`${p}_${s}`}>
											{s}
										</SelectItem>
									))}
								</SelectGroup>
								<SelectGroup>
									<SelectLabel className="-ml-2 text-xs">
										Pattern elements
									</SelectLabel>
									{specialStages.map((s) => (
										<SelectItem
											key={`${p}_${s}`}
											value={`${p}_${s}`}
											className="font-bold"
										>
											{s}
										</SelectItem>
									))}
								</SelectGroup>
								<SelectSeparator />
								<SelectItem value={`${p}_remove`} className="text-center">
									Remove <XCircle />
								</SelectItem>
							</SelectContent>
						</Select>
						{p < selectedStages.length && <p>&#8594;</p>}
					</div>
				))}
			</div>
			<div className="space-x-2">
				<a
					href={`data:text/json;charset=utf-8,${encodeURIComponent(
						JSON.stringify(jsonPattern),
					)}`}
					download="pattern.json"
					className={cn(buttonVariants())}
				>
					Download Json
					<Download />
				</a>
				<Button>Apply</Button>
			</div>
			<div
				className="row-span-4 border-gray-500 border"
				id="graph-container"
				style={{ height: "99%", width: "98%" }}
			/>
		</section>
	);
}
