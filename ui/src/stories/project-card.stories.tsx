import type { Meta, StoryObj } from "@storybook/react";
import { BrowserRouter } from "react-router";
import { ProjectCard } from "@/components/project-card";

const meta = {
	title: "Components/ProjectCard",
	component: ProjectCard,
	decorators: [
		(Story) => (
			<BrowserRouter>
				<div className="w-[300px] p-4 bg-slate-50 min-h-screen">
					<Story />
				</div>
			</BrowserRouter>
		),
	],
} satisfies Meta<typeof ProjectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		project: { id: "1", name: "Reusable workspace" },
	},
};
