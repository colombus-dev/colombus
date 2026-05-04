import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { type SavedPattern } from './components/Sidebar';
import { HomePage } from './V2/HomePage';
import { ExplorerPage } from './V2/ExplorerPage';
import { 
	DEFAULT_PATTERN_NAME, 
	DEFAULT_PATTERN_CODE, 
	PROJECTS, 
	NOTEBOOKS_DATA, 
	STEP_TO_MODELS 
} from './V2/data';
import { Project } from './V2/types';

export default function App() {
	const location = useLocation();
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
	const [activePatternName, setActivePatternName] = useState<string | null>(null);
	const [executedStepMatch, setExecutedStepMatch] = useState<string | null>(null);
	const [patternName, setPatternName] = useState(DEFAULT_PATTERN_NAME);
	const [dslCode, setDslCode] = useState(DEFAULT_PATTERN_CODE);
	const [editingPatternId, setEditingPatternId] = useState<string | null>(null);
	const [isExecuting, setIsExecuting] = useState(false);
	const executionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (executionTimeoutRef.current) {
				clearTimeout(executionTimeoutRef.current);
			}
		};
	}, []);

	const [isMenuOpen, setIsMenuOpen] = useState(true);
	const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
	const [projectQuery, setProjectQuery] = useState('');
	const [currentProjectId, setCurrentProjectId] = useState(PROJECTS[0].id);
	const [projects, setProjects] = useState<Project[]>(PROJECTS);
	const [newProjectName, setNewProjectName] = useState('');
	const [selectedNotebookIds, setSelectedNotebookIds] = useState<string[]>(Object.keys(NOTEBOOKS_DATA));
	const [savedPatterns, setSavedPatterns] = useState<SavedPattern[]>([]);
	const navigate = useNavigate();

	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		const projectId = searchParams.get('project');

		if (projectId && projects.some(project => project.id === projectId)) {
			setCurrentProjectId(projectId);
		}
	}, [location.search, projects]);

	const modelsForStep = selectedNodeId ? STEP_TO_MODELS[selectedNodeId as keyof typeof STEP_TO_MODELS] || [] : [];

	useEffect(() => {
		setSelectedModelIds([]);
	}, [selectedNodeId]);

	const visibleNotebookIds = useMemo(() => {
		let ids = Object.keys(NOTEBOOKS_DATA);

		if (selectedModelIds.length > 0) {
			const selectedModels = modelsForStep.filter(model => selectedModelIds.includes(model.id));
			const modelIds = selectedModels.flatMap(model => model.notebooks);
			ids = modelIds.length > 0 ? Array.from(new Set(modelIds)) : [];
		}

		if (executedStepMatch) {
			const normalizedStep = executedStepMatch.toLowerCase();
			let targetTemplate = '';
			if (normalizedStep.includes('load') || normalizedStep.includes('clean')) targetTemplate = 'data_cleaning';
			else if (normalizedStep.includes('explore')) targetTemplate = 'eda_summary';
			else if (normalizedStep.includes('review') || normalizedStep.includes('inspect')) targetTemplate = 'validation_review';
			else if (normalizedStep.includes('prepare') || normalizedStep.includes('transform')) targetTemplate = 'feature_engineering';
			else if (normalizedStep.includes('profile')) targetTemplate = 'profiling_notes';
			else if (normalizedStep.includes('split')) targetTemplate = 'train_test_split';

			if (targetTemplate) {
				ids = ids.filter(id => NOTEBOOKS_DATA[id].name.startsWith(targetTemplate));
			} else {
				const hash = Array.from(executedStepMatch).reduce((acc, char) => acc + char.charCodeAt(0), 0);
				ids = ids.filter((id) => {
					const idHash = parseInt(id.replace('nb', ''));
					return (idHash + hash) % 3 === 0;
				});
			}
		}

		return ids;
	}, [selectedModelIds, modelsForStep, executedStepMatch]);

	const notebooksForChart = useMemo(() => {
		return visibleNotebookIds
			.map(nbId => {
				const notebook = NOTEBOOKS_DATA[nbId as keyof typeof NOTEBOOKS_DATA];
				if (!notebook) return null;

				return {
					id: notebook.id,
					name: notebook.name,
					score: notebook.score,
				};
			})
			.filter((notebook): notebook is { id: string; name: string; score: number } => notebook !== null);
	}, [visibleNotebookIds]);

	useEffect(() => {
		setSelectedNotebookIds(previousSelectedNotebookIds => {
			const visibleNotebookSet = new Set(visibleNotebookIds);
			const nextSelectedNotebookIds = previousSelectedNotebookIds.filter(notebookId => visibleNotebookSet.has(notebookId));

			if (nextSelectedNotebookIds.length === previousSelectedNotebookIds.length && nextSelectedNotebookIds.every((notebookId, index) => notebookId === previousSelectedNotebookIds[index])) {
				return previousSelectedNotebookIds;
			}

			return nextSelectedNotebookIds;
		});
	}, [visibleNotebookIds]);

	const selectedNotebooksForChart = useMemo(() => {
		const selectedNotebookSet = new Set(selectedNotebookIds);
		return notebooksForChart.filter(notebook => selectedNotebookSet.has(notebook.id));
	}, [notebooksForChart, selectedNotebookIds]);

	const patternFocusRange = activePatternName ? { start: 28, end: 66 } : null;

	const activeProjectList = projects;
	const currentProjectInList = activeProjectList.find(project => project.id === currentProjectId) ?? activeProjectList[0];

	const filteredProjects = useMemo(() => {
		const normalizedQuery = projectQuery.trim().toLowerCase();

		if (normalizedQuery.length === 0) {
			return activeProjectList;
		}

		return activeProjectList.filter(project => {
			return [project.name, project.branch, project.description]
				.join(' ')
				.toLowerCase()
				.includes(normalizedQuery);
		});
	}, [activeProjectList, projectQuery]);

	useEffect(() => {
		if (patternName.trim() === '' && dslCode.trim() === '') {
			setEditingPatternId(null);
		}
	}, [patternName, dslCode]);

	const handleSavePattern = () => {
		const trimmedName = patternName.trim();
		const trimmedCode = dslCode.trim();

		if (!trimmedName) {
			return;
		}

		let targetId = editingPatternId;
		if (!targetId) {
			const existing = savedPatterns.find(p => p.name === trimmedName);
			if (existing) {
				targetId = existing.id;
			}
		}

		if (targetId) {
			setSavedPatterns(prev => prev.map(p => p.id === targetId ? { ...p, name: trimmedName, code: trimmedCode } : p));
			if (!editingPatternId) {
				setEditingPatternId(targetId);
			}
		} else {
			const newId = Date.now().toString();
			setSavedPatterns(prev => [...prev, { id: newId, name: trimmedName, code: trimmedCode }]);
			setEditingPatternId(newId);
		}
	};

	const handleStopExecution = () => {
		if (executionTimeoutRef.current) {
			clearTimeout(executionTimeoutRef.current);
		}
		setIsExecuting(false);
		setExecutedStepMatch(null);
		setActivePatternName(null);
	};

	const handleExecutePattern = () => {
		setIsExecuting(true);
		if (executionTimeoutRef.current) {
			clearTimeout(executionTimeoutRef.current);
		}

		executionTimeoutRef.current = setTimeout(() => {
			const fullText = [patternName, dslCode].filter(Boolean).join('\n');
			const match = /step="([^"]+)"/i.exec(fullText);
			setExecutedStepMatch(match ? match[1] : null);
			setActivePatternName(patternName);
			setIsExecuting(false);
		}, 1500); // 1.5 seconds simulated loading
	};

	const handleExecutePatternFromSidebar = (pattern: SavedPattern) => {
		setPatternName(pattern.name);
		setDslCode(pattern.code);
		setActivePatternName(pattern.name);
		
		setIsExecuting(true);
		if (executionTimeoutRef.current) {
			clearTimeout(executionTimeoutRef.current);
		}

		executionTimeoutRef.current = setTimeout(() => {
			const match = /step="([^"]+)"/i.exec(pattern.code);
			setExecutedStepMatch(match ? match[1] : null);
			setIsExecuting(false);
		}, 1500);
	};

	const handleEditPatternFromSidebar = (pattern: SavedPattern) => {
		setEditingPatternId(pattern.id);
		setPatternName(pattern.name);
		setDslCode(pattern.code);
	};

	const handleDeletePatternFromSidebar = (id: string) => {
		setSavedPatterns(prev => prev.filter(p => p.id !== id));
		if (editingPatternId === id) {
			setEditingPatternId(null);
			setPatternName('');
			setDslCode('');
		}
	};

	const handleCreateProject = () => {
		const trimmedName = newProjectName.trim();

		if (!trimmedName) {
			return;
		}

		const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
		const newProject: Project = {
			id: `${slug}-${Date.now().toString(36)}`,
			name: trimmedName,
			branch: 'main',
			description: 'New workspace',
		};

		setProjects(previous => [newProject, ...previous]);
		setCurrentProjectId(newProject.id);
		setNewProjectName('');
		navigate(`/explorer?project=${newProject.id}`);
	};

	const handleNavigate = (view: 'home' | 'explorer') => {
		navigate(view === 'home' ? '/' : '/explorer');
	};

	const handleOpenProject = (projectId: string) => {
		setCurrentProjectId(projectId);
		setIsProjectMenuOpen(false);
		navigate(`/explorer?project=${projectId}`);
	};

	return (
		<Routes>
			<Route
				path="/"
				element={
					<HomePage
						activeProjectList={activeProjectList}
						currentProjectId={currentProjectId}
						newProjectName={newProjectName}
						onOpenProject={handleOpenProject}
						onCreateProject={handleCreateProject}
						onNewProjectNameChange={setNewProjectName}
						onNavigate={handleNavigate}
						currentProjectInList={currentProjectInList}
						filteredProjects={filteredProjects}
						projectQuery={projectQuery}
						isProjectMenuOpen={isProjectMenuOpen}
						onToggleProjectMenu={() => setIsProjectMenuOpen(previous => !previous)}
						onProjectQueryChange={setProjectQuery}
					/>
				}
			/>
			<Route
				path="/home"
				element={
					<HomePage
						activeProjectList={activeProjectList}
						currentProjectId={currentProjectId}
						newProjectName={newProjectName}
						onOpenProject={handleOpenProject}
						onCreateProject={handleCreateProject}
						onNewProjectNameChange={setNewProjectName}
						onNavigate={handleNavigate}
						currentProjectInList={currentProjectInList}
						filteredProjects={filteredProjects}
						projectQuery={projectQuery}
						isProjectMenuOpen={isProjectMenuOpen}
						onToggleProjectMenu={() => setIsProjectMenuOpen(previous => !previous)}
						onProjectQueryChange={setProjectQuery}
					/>
				}
			/>
			<Route
				path="/explorer"
				element={
					<ExplorerPage
						isMenuOpen={isMenuOpen}
						currentProjectInList={currentProjectInList}
						selectedNodeId={selectedNodeId}
						patternName={patternName}
						dslCode={dslCode}
						notebooksForChart={notebooksForChart}
						selectedNotebooksForChart={selectedNotebooksForChart}
						selectedNotebookIds={selectedNotebookIds}
						visibleNotebookIds={visibleNotebookIds}
						activePatternName={activePatternName}
						patternFocusRange={patternFocusRange}
						onNavigate={handleNavigate}
						onToggleMenu={() => setIsMenuOpen(previous => !previous)}
						onPatternNameChange={setPatternName}
						onDslCodeChange={setDslCode}
						onExecutePattern={handleExecutePattern}
						onStopExecution={handleStopExecution}
						isExecuting={isExecuting}
						hasActiveExecution={isExecuting || executedStepMatch !== null}
						onSavePattern={handleSavePattern}
						onSelectedNodeChange={setSelectedNodeId}
						onToggleProjectMenu={() => setIsProjectMenuOpen(previous => !previous)}
						projectQuery={projectQuery}
						filteredProjects={filteredProjects}
						isProjectMenuOpen={isProjectMenuOpen}
						onProjectQueryChange={setProjectQuery}
						onOpenProject={handleOpenProject}
						onSelectedNotebookIdsChange={setSelectedNotebookIds}
						savedPatterns={savedPatterns}
						onExecutePatternFromSidebar={handleExecutePatternFromSidebar}
						onEditPatternFromSidebar={handleEditPatternFromSidebar}
						onDeletePatternFromSidebar={handleDeletePatternFromSidebar}
					/>
				}
			/>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}
