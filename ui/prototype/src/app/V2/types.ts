export type NotebookData = {
	id: string;
	name: string;
	type: 'Jupyter Notebook';
	score: number;
};

export type Project = {
	id: string;
	name: string;
	branch: string;
	description: string;
};

export type WorkspaceHeaderProps = {
	variant: 'home' | 'explorer';
	currentProjectName: string;
	currentProjectInList: Project;
	filteredProjects: Project[];
	projectQuery: string;
	isProjectMenuOpen: boolean;
	onToggleProjectMenu: () => void;
	onProjectQueryChange: (value: string) => void;
	onNavigate: (view: 'home' | 'explorer') => void;
	onOpenProject: (projectId: string) => void;
};

export type HomePageProps = {
	activeProjectList: Project[];
	currentProjectId: string;
	newProjectName: string;
	onOpenProject: (projectId: string) => void;
	onCreateProject: () => void;
	onNewProjectNameChange: (value: string) => void;
	onNavigate: (view: 'home' | 'explorer') => void;
	// WorkspaceHeader props
	currentProjectInList: Project;
	filteredProjects: Project[];
	projectQuery: string;
	isProjectMenuOpen: boolean;
	onToggleProjectMenu: () => void;
	onProjectQueryChange: (value: string) => void;
};

export type ExplorerPageProps = {
	isMenuOpen: boolean;
	currentProjectInList: Project;
	selectedNodeId: string | null;
	patternName: string;
	dslCode: string;
	notebooksForChart: { id: string; name: string; score: number }[];
	selectedNotebooksForChart: { id: string; name: string; score: number }[];
	selectedNotebookIds: string[];
	visibleNotebookIds: string[];
	activePatternName: string | null;
	patternFocusRange: { start: number; end: number } | null;
	onNavigate: (view: 'home' | 'explorer') => void;
	onToggleMenu: () => void;
	onPatternNameChange: (value: string) => void;
	onDslCodeChange: (value: string) => void;
	onExecutePattern: () => void;
	onStopExecution: () => void;
	isExecuting: boolean;
	hasActiveExecution: boolean;
	onSavePattern: () => void;
	onSelectedNodeChange: (value: string | null) => void;
	onToggleProjectMenu: () => void;
	projectQuery: string;
	filteredProjects: Project[];
	isProjectMenuOpen: boolean;
	onProjectQueryChange: (value: string) => void;
	onOpenProject: (projectId: string) => void;
	onSelectedNotebookIdsChange: (nextSelectedNotebookIds: string[]) => void;
	savedPatterns: any[]; // Changed to any for now to avoid circular or missing imports
	onExecutePatternFromSidebar: (pattern: any) => void;
	onEditPatternFromSidebar: (pattern: any) => void;
	onDeletePatternFromSidebar: (patternId: string) => void;
};
