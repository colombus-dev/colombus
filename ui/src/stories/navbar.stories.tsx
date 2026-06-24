import type { Meta, StoryObj } from "@storybook/react";
import { BrowserRouter } from "react-router";
import { Navbar } from "@/components/navbar";

const meta: Meta<typeof Navbar> = {
	title: "Components/Navbar",
	component: Navbar,
	parameters: {
		layout: "fullscreen",
	},
	decorators: [
		(Story) => (
			<BrowserRouter>
				<Story />
			</BrowserRouter>
		),
	],
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Navbar>;

export const DefaultHome: Story = {
	args: {
		isOnProject: false,
		projectName: undefined,
		onLogout: () => console.log("Logout clicked"),
	},
};

export const WithinProject: Story = {
	args: {
		isOnProject: true,
		projectName: "Reusable workspace",
		onLogout: () => console.log("Logout clicked"),
	},
};
