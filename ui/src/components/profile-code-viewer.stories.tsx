import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import {
	axiosInstance,
	type GraphDefinition,
	type StepNode,
} from "@/api/client";
import type { PpmResult } from "@/lib/types";
import { useColombusStore } from "@/store";
import ProfileCodeViewer from "./profile-code-viewer";

const mockSteps: StepNode[] = [
	{ id: "step_0", name: "load_data", position: 0, number_children: 0 },
	{ id: "step_1", name: "process_data", position: 1, number_children: 0 },
	{ id: "step_2", name: "train_model", position: 2, number_children: 0 },
];

const mockNodes: GraphDefinition[] = [
	{
		id: "notebook_1",
		name: "notebook_1.ipynb",
		steps: mockSteps,
		meta_instructions: [
			{
				id: "meta_0",
				step_id: "step_0",
				function: "load",
				algoFamily: "",
				algoName: "",
				library: "",
				position: 0,
				number_children: 0,
			},
			{
				id: "meta_1",
				step_id: "step_1",
				function: "process",
				algoFamily: "",
				algoName: "",
				library: "",
				position: 1,
				number_children: 0,
			},
			{
				id: "meta_2",
				step_id: "step_2",
				function: "train",
				algoFamily: "",
				algoName: "",
				library: "",
				position: 2,
				number_children: 0,
			},
		],
		codes: [
			{
				id: "code_0",
				meta_instruction_id: "meta_0",
				content:
					"import pandas as pd\n\ndf = pd.read_csv('data.csv')\nprint(df.head())",
				position: 0,
			},
			{
				id: "code_1",
				meta_instruction_id: "meta_1",
				content: "df = df.dropna()\ndf['value'] = df['value'] * 2",
				position: 1,
			},
			{
				id: "code_2",
				meta_instruction_id: "meta_2",
				content:
					"from sklearn.linear_model import LinearRegression\n\nmodel = LinearRegression()\nmodel.fit(df[['value']], df['target'])",
				position: 2,
			},
		],
	},
];

const mockPpmData: PpmResult[] = [
	{
		profile_name: "notebook_1.ipynb",
		results: [["step_0"], ["step_1"]],
	},
];

const ZustandMockDecorator = (Story: any) => {
	useEffect(() => {
		useColombusStore.setState({
			selectedProfileNodeId: "notebook_1",
			availableProfilesWithPpmData: mockPpmData,
			currentPattern: {
				name: "Test Pattern",
				groups: [{ name: "g1", steps: ["load_data", "process_data"] }],
			},
			allSavedPatterns: [
				{
					name: "Test Pattern",
					groups: [{ name: "g1", steps: ["load_data", "process_data"] }],
				},
			],
			jwtToken: "mock-token",
		});

		axiosInstance.defaults.headers.common["x-api-key"] = "mock-token";
	}, []);

	return <Story />;
};

const meta = {
	title: "Components/ProfileCodeViewer",
	component: ProfileCodeViewer,
	parameters: {
		layout: "fullscreen",
	},
	decorators: [
		ZustandMockDecorator,
		(Story) => (
			<MemoryRouter initialEntries={["/project/test-project-123"]}>
				<Routes>
					<Route
						path="/project/:projectId"
						element={
							<div className="w-screen h-screen bg-slate-100 p-8 flex items-center justify-center">
								<div className="w-[1000px] h-[600px]">
									<Story />
								</div>
							</div>
						}
					/>
				</Routes>
			</MemoryRouter>
		),
	],
	tags: ["autodocs"],
} satisfies Meta<typeof ProfileCodeViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		nodes: mockNodes,
	},
};
