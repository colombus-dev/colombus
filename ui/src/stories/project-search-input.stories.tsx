import type { Meta } from "@storybook/react";
import { useState } from "react";
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

const StatefulSearchInput = () => {
	const [value, setValue] = useState("");
	return <ProjectSearchInput value={value} onChange={setValue} />;
};

export const Default = {
	render: () => <StatefulSearchInput />,
};
