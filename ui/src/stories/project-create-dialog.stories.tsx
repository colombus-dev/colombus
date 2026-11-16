import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProjectCreateDialog } from "@/components/project-create-dialog";

const meta = {
	title: "Components/ProjectCreateDialog",
	component: ProjectCreateDialog,
	tags: ["autodocs"],
} satisfies Meta<typeof ProjectCreateDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onCreated: (project) => console.log("Created", project),
	},
};
