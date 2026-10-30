import type { Meta, StoryObj } from "@storybook/react";
import type { GraphDefinition, StepNode } from "@/api/client";
import type { PpmResult } from "@/lib/types";
import ProfileCodeViewer from "./profile-code-viewer";

const mockSteps: StepNode[] = [
	{ id: "step_0", name: "Data Collection", position: 0, number_children: 0 },
	{ id: "step_1", name: "Data Preparation", position: 1, number_children: 0 },
	{ id: "step_2", name: "Data Collection", position: 2, number_children: 0 },
	{ id: "step_3", name: "Data Modeling", position: 3, number_children: 0 },
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
				function: "fetch_more",
				algoFamily: "",
				algoName: "",
				library: "",
				position: 2,
				number_children: 0,
			},
			{
				id: "meta_3",
				step_id: "step_3",
				function: "train",
				algoFamily: "",
				algoName: "",
				library: "",
				position: 3,
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
					"extra_data = pd.read_json('more_data.json')\ndf = pd.concat([df, extra_data])",
				position: 2,
			},
			{
				id: "code_3",
				meta_instruction_id: "meta_3",
				content:
					"from sklearn.linear_model import LinearRegression\n\nmodel = LinearRegression()\nmodel.fit(df[['value']], df['target'])",
				position: 3,
			},
		],
	},
];

const mockPpmData: PpmResult[] = [
	{
		profile_name: "notebook_1.ipynb",
		results: [["step_0"], ["step_2"]],
	},
];

const meta = {
	title: "Components/ProfileCodeViewer",
	component: ProfileCodeViewer,
	parameters: {
		layout: "fullscreen",
	},
	argTypes: {
		overrideSelectedNodeId: { table: { disable: true } },
		overridePattern: { table: { disable: true } },
		overridePpmData: { table: { disable: true } },
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ProfileCodeViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		nodes: mockNodes,
		overrideSelectedNodeId: "notebook_1",
		overridePattern: null,
		overridePpmData: [],
	},
};

export const WithPatternMatched: Story = {
	args: {
		nodes: mockNodes,
		overrideSelectedNodeId: "notebook_1",
		overridePattern: {
			name: "Data Collection Pattern",
			groups: [{ name: "g1", steps: ["Data Collection"] }],
		},
		overridePpmData: mockPpmData,
	},
};

export const EmptyState: Story = {
	args: {
		nodes: [],
		overrideSelectedNodeId: null,
	},
};

export const NoProfileSelected: Story = {
	args: {
		nodes: mockNodes,
		overrideSelectedNodeId: null,
		overridePattern: null,
		overridePpmData: [],
	},
};
