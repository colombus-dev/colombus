import { ChevronDown, FolderOpen, Search } from 'lucide-react';
import workspaceLogo from '../../imports/logo.png';
import { WorkspaceHeaderProps } from './types';

export function WorkspaceHeader({
	variant,
	currentProjectName,
	currentProjectInList,
	filteredProjects,
	projectQuery,
	isProjectMenuOpen,
	onToggleProjectMenu,
	onProjectQueryChange,
	onNavigate,
	onOpenProject,
}: WorkspaceHeaderProps) {
	return (
		<header className="relative z-50 flex-shrink-0 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-sm">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-6 text-sm text-slate-600">
					<img src={workspaceLogo} alt="Workspace logo" className="h-10 w-auto shrink-0" />

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => onNavigate('home')}
							className="flex items-center gap-2 rounded-full px-2 py-1 cursor-pointer text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
							aria-label="Go to home"
							title="Go to home"
						>
							<FolderOpen className="h-4 w-4" />
							<span className="font-medium">Projects</span>
						</button>

						<span className="text-slate-300">/</span>
						<span className="font-bold text-slate-900">{currentProjectName}</span>
					

						<div className="relative">
							<button
								type="button"
								onClick={onToggleProjectMenu}
								className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600 transition-colors hover:text-slate-900"
							>
								Switch project
								<ChevronDown className={`h-3.5 w-3.5 transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
							</button>
							{isProjectMenuOpen ? (
								<div className="absolute left-0 top-full z-[70] mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-200/80">
									<div className="mb-3">
										<label htmlFor="project-search" className="sr-only">
											Search projects
										</label>
										<div className="relative">
											<Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
											<input
												id="project-search"
												type="search"
												value={projectQuery}
												onChange={event => onProjectQueryChange(event.target.value)}
												placeholder="Search projects"
												className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
											/>
										</div>
									</div>
									<div className="max-h-60 space-y-1 overflow-auto pr-1">
										{filteredProjects.map(project => {
											const isSelected = project.id === currentProjectInList.id;

											return (
												<button
													key={project.id}
													type="button"
													onClick={() => onOpenProject(project.id)}
													className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
												>
													<div>
														<p className="text-sm font-medium text-slate-900">{project.name}</p>
														<p className="text-xs text-slate-500">{project.branch}</p>
													</div>
													{isSelected ? <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Active</span> : null}
												</button>
											);
										})}

										{filteredProjects.length === 0 ? (
											<div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
												No projects found.
											</div>
										) : null}
									</div>
								</div>
							) : null}
						</div>
					</div>
				</div>

				<div className="flex items-center gap-3" />
			</div>
		</header>
	);
}
