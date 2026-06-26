import type { Meta } from "@storybook/react";
import { useState } from "react";
import { BrowserRouter } from "react-router";
import { ProjectCard } from "@/components/project-card";
import { ProjectSearchInput } from "@/components/project-search-input";

const meta = {
	title: "Components/ProjectSearchInput",
	component: ProjectSearchInput,
	decorators: [
		(Story) => (
			<div className="p-6 bg-slate-50 min-h-screen">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof ProjectSearchInput>;

export default meta;

const StatefulSearchInput = ({
	initialValue = "",
}: {
	initialValue?: string;
}) => {
	const [value, setValue] = useState(initialValue);
	return <ProjectSearchInput value={value} onChange={setValue} />;
};

export const Default = {
	render: () => <StatefulSearchInput />,
};

export const WithText = {
	render: () => (
		<BrowserRouter>
			<div className="space-y-6 max-w-5xl">
				<StatefulSearchInput initialValue="Data analysis" />
				<div className="w-[268px]">
					<ProjectCard project={{ id: "1", name: "Data analysis" }} />
				</div>
			</div>
		</BrowserRouter>
	),
};

export const NoResults = {
	render: () => (
		<div className="space-y-6">
			<StatefulSearchInput initialValue="azerty123" />
			<div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
				No projects found.
			</div>
		</div>
	),
};
