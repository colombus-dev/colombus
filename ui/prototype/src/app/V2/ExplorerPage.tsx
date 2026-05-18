import { Sidebar } from '../components/Sidebar';
import { ExplorerNotebookResultsPanel } from '../components/ExplorerNotebookResultsPanel';
import { CreatePatternPanel } from '../components/CreatePatternPanel';
import { NodeGraph } from '../components/NodeGraph';
import { WorkspaceHeader } from './WorkspaceHeader';
import { ExplorerPageProps } from './types';

export function ExplorerPage({
	isMenuOpen,
	currentProjectInList,
	selectedNodeId,
	patternName,
	dslCode,
	notebooksForChart,
	selectedNotebooksForChart,
	selectedNotebookIds,
	visibleNotebookIds,
	activePatternName,
	patternFocusRange,
	onNavigate,
	onToggleMenu,
	onPatternNameChange,
	onDslCodeChange,
	onExecutePattern,
	onStopExecution,
	isExecuting,
	hasActiveExecution,
	onSavePattern,
	onSelectedNodeChange,
	onToggleProjectMenu,
	projectQuery,
	filteredProjects,
	isProjectMenuOpen,
	onProjectQueryChange,
	onOpenProject,
	onSelectedNotebookIdsChange,
	savedPatterns,
	onExecutePatternFromSidebar,
	onEditPatternFromSidebar,
	onDeletePatternFromSidebar,
}: ExplorerPageProps) {
	return (
		<div className="flex h-screen min-h-0 flex-col bg-gray-50">
			<WorkspaceHeader
				variant="explorer"
				currentProjectName={currentProjectInList.name}
				currentProjectInList={currentProjectInList}
				filteredProjects={filteredProjects}
				projectQuery={projectQuery}
				isProjectMenuOpen={isProjectMenuOpen}
				onToggleProjectMenu={onToggleProjectMenu}
				onProjectQueryChange={onProjectQueryChange}
				onNavigate={onNavigate}
				onOpenProject={onOpenProject}
			/>

			<div className="flex min-h-0 flex-1 overflow-hidden">
				<aside
					className="flex h-full shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-300 ease-out"
					style={{ width: isMenuOpen ? 240 : 48 }}
				>
					<div className="min-h-0 flex-1 overflow-hidden">
						<Sidebar
							projectName={currentProjectInList.name}
							activeView="explorer"
							onNavigate={onNavigate}
							isMenuOpen={isMenuOpen}
							onToggleMenu={onToggleMenu}
							savedPatterns={savedPatterns}
							onEditPattern={onEditPatternFromSidebar}
							onDeletePattern={onDeletePatternFromSidebar}
						/>
					</div>
				</aside>

				<div className="flex flex-1 flex-col overflow-hidden">
					<div className="flex-shrink-0 px-5 pt-4">
						<CreatePatternPanel
							patternName={patternName}
							dslCode={dslCode}
							onPatternNameChange={onPatternNameChange}
							onDslCodeChange={onDslCodeChange}
							onExecutePattern={onExecutePattern}
							onStopExecution={onStopExecution}
							isExecuting={isExecuting}
							hasActiveExecution={hasActiveExecution}
							onSavePattern={onSavePattern}
						/>
					</div>

					<div className="flex flex-1 min-h-0 overflow-hidden px-5 pb-4 pt-4 gap-4">
						<div className="w-[260px] shrink-0 overflow-hidden">
							<ExplorerNotebookResultsPanel
								notebooks={notebooksForChart}
								selectedNotebookIds={selectedNotebookIds}
								onSelectedNotebookIdsChange={onSelectedNotebookIdsChange}
							/>
						</div>

						<div className="min-w-0 flex-1">
							<NodeGraph
								selectedNodeId={selectedNodeId}
								onNodeSelect={onSelectedNodeChange}
								visibleNotebookIds={visibleNotebookIds}
								visibleNotebooks={selectedNotebooksForChart}
								heatmapPatternName={activePatternName}
								heatmapFocusRange={patternFocusRange}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
