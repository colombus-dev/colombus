import { Project, NotebookData } from './types';

export const DEFAULT_PATTERN_NAME = 'pattern myPattern =';
export const DEFAULT_PATTERN_CODE = `# Write your Canopus DSL pattern below`;

export const NOTEBOOK_TEMPLATE = [
	'data_cleaning',
	'missing_values',
	'feature_engineering',
	'encoding_columns',
	'normalize_data',
	'outliers_filter',
	'eda_summary',
	'train_test_split',
	'pipeline_prep_v1',
	'pipeline_prep_v2',
	'feature_selection',
	'model_training',
	'model_tuning',
	'validation_review',
	'profiling_notes',
] as const;

export const NOTEBOOK_SCORE_SEQUENCE = [
	0.02,
	0.08,
	0.15,
	0.23,
	0.31,
	0.39,
	0.48,
	0.56,
	0.64,
	0.72,
	0.81,
	0.88,
	0.93,
	0.97,
	0.99,
];

export function buildNotebookName(index: number) {
	const template = NOTEBOOK_TEMPLATE[index % NOTEBOOK_TEMPLATE.length];
	const suffix = String(Math.floor(index / NOTEBOOK_TEMPLATE.length) + 1).padStart(2, '0');
	return `${template}_${suffix}.ipynb`;
}

export function buildNotebookScore(index: number) {
	const score = NOTEBOOK_SCORE_SEQUENCE[index % NOTEBOOK_SCORE_SEQUENCE.length];
	const cycle = Math.floor(index / NOTEBOOK_SCORE_SEQUENCE.length) % 3;
	const adjustedScore = cycle === 0 ? score : cycle === 1 ? score + 0.02 : score - 0.02;

	return Math.max(0, Math.min(1, Number(adjustedScore.toFixed(2))));
}

export const NOTEBOOKS_DATA: Record<string, NotebookData> = Object.fromEntries(
	Array.from({ length: 150 }, (_, index) => {
		const notebookId = `nb${index + 1}`;
		return [
			notebookId,
			{
				id: notebookId,
				name: buildNotebookName(index),
				type: 'Jupyter Notebook' as const,
				score: buildNotebookScore(index),
			},
		];
	})
) as Record<string, NotebookData>;

export const STEP_TO_MODELS = {
	nb1: [
		{ id: 'model1', name: 'ensemble_training_flow', type: 'Ensemble model', score: 0.82, notebooks: ['nb1', 'nb2', 'nb3'] },
		{ id: 'model2', name: 'classification_metrics', type: 'Gradient model', score: 0.78, notebooks: ['nb1', 'nb4'] },
	],
	nb2: [{ id: 'model3', name: 'feature_scaling', type: 'Dimensionality reduction', score: 0.76, notebooks: ['nb2', 'nb5'] }],
	nb3: [{ id: 'model1', name: 'ensemble_training_flow', type: 'Ensemble model', score: 0.82, notebooks: ['nb3', 'nb6'] }],
	nb4: [
		{ id: 'model4', name: 'feature_importance', type: 'Ensemble model', score: 0.8, notebooks: ['nb4', 'nb7'] },
		{ id: 'model2', name: 'classification_metrics', type: 'Gradient model', score: 0.78, notebooks: ['nb2', 'nb4'] },
	],
	nb5: [{ id: 'model5', name: 'validation_pipeline', type: 'Gradient model', score: 0.85, notebooks: ['nb5', 'nb8', 'nb9'] }],
	nb6: [{ id: 'model6', name: 'reference_pipeline', type: 'Dimensionality reduction', score: 0.72, notebooks: [] }],
	nb7: [{ id: 'model7', name: 'decision_boundary', type: 'Ensemble model', score: 0.88, notebooks: ['nb7', 'nb9'] }],
	nb8: [{ id: 'model8', name: 'optimizer_tuning', type: 'Neural network', score: 0.91, notebooks: ['nb8', 'nb10'] }],
	nb9: [
		{ id: 'model1', name: 'ensemble_training_flow', type: 'Ensemble model', score: 0.82, notebooks: ['nb9', 'nb3'] },
		{ id: 'model5', name: 'validation_pipeline', type: 'Gradient model', score: 0.85, notebooks: ['nb9', 'nb6'] },
	],
	nb10: [{ id: 'model8', name: 'optimizer_tuning', type: 'Neural network', score: 0.91, notebooks: ['nb10', 'nb7'] }],
};

export const PROJECTS: Project[] = [
	{
		id: 'reusable-workspace',
		name: 'Reusable workspace',
		branch: 'main',
		description: 'Prototype dashboard',
	},
	{
		id: 'notebook-audit',
		name: 'Notebook audit',
		branch: 'audit',
		description: 'Quality and score review',
	},
	{
		id: 'model-explorer',
		name: 'Model explorer',
		branch: 'explorer',
		description: 'Steps and relationships',
	},
];
