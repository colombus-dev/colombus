import ProfilePattern from "@/components/profile-pattern";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Graph from "graphology";
import { Download } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Sigma from "sigma";

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
		<section className="grid grid-row-8 space-x-4 h-full">
			<ProfilePattern
				className="row-span-2"
				stages={selectedStages}
				onStagesChanged={setSelectedStages}
				editable
			/>
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
