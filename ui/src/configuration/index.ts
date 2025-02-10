// Profile/PPM stages-related configuration

export type PpmNodesDisplayMode = "show-all" | "show-fixed" | "show-variable";

export const supportedSteps = [
	"Library Loading",
	"Visualization",
	"Others",
	"Data Preparation",
	"Data Profiling and Exploratory Data Analysis",
	"Data Preparation and Exploration",
	"Data Cleaning Filtering",
	"Data Sub-sampling and Train-test Splitting",
	"Data Loading",
	"Exploratory Data Analysis",
	"Feature Engineering",
	"Feature Transformation",
	"Feature Selection",
	"Model Building and Training",
	"Model Training",
	"Model Parameter Tuning",
	"Model Validation and Assembling",
];
export const specialSteps = ["*"];
export const specialCharacterOR = "|";
export const specialCharacterNOT = "!";
export const specialCharacterSTAR = "*";
export const specialCharacterPLUS = "+";

// graph styling configuration

export const colors = ["#F79767", "#ffd700", "#57C7E3", "#F16667", "#D9C8AE"];

export const stepsColorsMapping: { [stepName: string]: string } = {
	"Library Loading": "#ff0029",
	Visualization: "#377eb8",
	Others: "#66a61e",
	"Data Preparation": "#984ea3",
	"Data Profiling and Exploratory Data Analysis": "#00d2d5",
	"Data Preparation and Exploration": "#ff7f00",
	"Data Cleaning Filtering": "#af8d00",
	"Data Sub-sampling and Train-test Splitting": "#7f80cd",
	"Data Loading": "#b3e900",
	"Exploratory Data Analysis": "#c42e60",
	"Feature Engineering": "#a65628",
	"Feature Transformation": "#f781bf",
	"Feature Selection": "#8dd3c7",
	"Model Building and Training": "#bebada",
	"Model Training": "#fb8072",
	"Model Parameter Tuning": "#80b1d3",
	"Model Validation and Assembling": "#fdb462",
};
