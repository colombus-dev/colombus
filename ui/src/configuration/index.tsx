// Profile/PPM stages-related configuration
import {
	Box,
	Brain,
	Database,
	LineChart,
	type LucideIcon,
	Rocket,
	Save,
	Wrench,
} from "lucide-react";

export type PpmNodesDisplayMode = "show-all" | "show-fixed" | "show-variable";

export const supportedSteps = [
	"Data Collection",
	"Data Preparation",
	"Data Modeling",
	"Model Deployment",
	"Model Evaluation",
	"Save Results",
];

export const metacharacterSTARTS = "^";
export const metacharacterENDS = "$";
export const metacharacterOR = "|";
export const metacharacterNOT = "!";
export const metacharacterSTAR = "*";
export const metacharacterPLUS = "+";

// graph styling configuration

export const colors = [
	"#F79767",
	"#ffd700",
	"#57C7E3",
	"#D9C8AE",
	"#808080",
	"#4f4f4f",
];

export const algoNodeSuffix = "-algo";
export const libraryFunctionNodeSuffix = "-libfunc";

export const stepsColorsMapping: { [stepName: string]: string } = {
	"Data Collection": "#ff0029",
	"Data Preparation": "#984ea3",
	"Data Modeling": "#7f80cd",
	"Model Deployment": "#80b1d3",
	"Model Evaluation": "#af8d00",
	"Save Results": "#8dd3c7",
};

const stepsIcons: { [stepName: string]: LucideIcon } = {
	"Data Collection": Database,
	"Data Preparation": Wrench,
	"Data Modeling": Brain,
	"Model Evaluation": LineChart,
	"Model Deployment": Rocket,
	"Save Results": Save,
};

export const getStepIcon = (name: string) => {
	const Icon = stepsIcons[name] || Box;
	return <Icon className="w-5 h-5" />;
};
