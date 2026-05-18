export const sampleNotebooks = [
  { id: 'nb-01', name: 'load_data.ipynb', score: 0.18 },
  { id: 'nb-02', name: 'inspect_values.ipynb', score: 0.34 },
  { id: 'nb-03', name: 'prepare_features.ipynb', score: 0.52 },
  { id: 'nb-04', name: 'train_model.ipynb', score: 0.76 },
  { id: 'nb-05', name: 'review_results.ipynb', score: 0.91 },
];

export const sampleVisibleNotebooks = [
  { id: 'nb-01', name: 'load_data.ipynb', score: 0.18 },
  { id: 'nb-02', name: 'inspect_values.ipynb', score: 0.34 },
  { id: 'nb-03', name: 'prepare_features.ipynb', score: 0.52 },
  { id: 'nb-04', name: 'train_model.ipynb', score: 0.76 },
  { id: 'nb-05', name: 'review_results.ipynb', score: 0.91 },
];

export const samplePatternName = 'step = "value"';

export const sampleFocusRange = { start: 20, end: 48 };

export const sampleSelectedNode = {
  id: 'step-clean',
  label: 'clean',
  type: 'step',
};

export const sampleDetailModels = [
  {
    id: 'model-1',
    name: 'ensemble_training_flow',
    type: 'Ensemble model',
    score: 0.82,
    notebooks: ['nb-01', 'nb-02'],
    notebooksData: [
      { id: 'nb-01', name: 'load_data.ipynb', type: 'Jupyter Notebook', score: 0.18 },
      { id: 'nb-02', name: 'inspect_values.ipynb', type: 'Jupyter Notebook', score: 0.34 },
    ],
  },
  {
    id: 'model-2',
    name: 'classification_metrics',
    type: 'Gradient model',
    score: 0.78,
    notebooks: ['nb-03'],
    notebooksData: [
      { id: 'nb-03', name: 'prepare_features.ipynb', type: 'Jupyter Notebook', score: 0.52 },
    ],
  },
];