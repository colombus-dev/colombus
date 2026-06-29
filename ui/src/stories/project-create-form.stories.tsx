import type { Meta, StoryObj } from "@storybook/react";
import { BrowserRouter } from "react-router";
import { ProjectCreateForm } from "@/components/project-create-form";

const meta = {
	title: "Components/ProjectCreateForm",
	component: ProjectCreateForm,
	decorators: [
		(Story) => (
			<BrowserRouter>
				<div className="max-w-[800px] p-6 bg-slate-50 min-h-screen">
					<Story />
				</div>
			</BrowserRouter>
		),
	],
} satisfies Meta<typeof ProjectCreateForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
