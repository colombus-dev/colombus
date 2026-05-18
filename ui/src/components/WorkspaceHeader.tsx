import { ChevronDown, FolderOpen, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useColombusStore } from '@/store';
import workspaceLogo from '../../prototype/src/imports/logo.png';

interface Project {
	id: string;
	name: string;
	branch: string;
	description: string;
}

export function WorkspaceHeader() {
	const navigate = useNavigate();
	const location = useLocation();
	const projectName = useColombusStore((state) => state.projectName);
	const setProjectName = useColombusStore((state) => state.setProjectName);
	
	const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
	const [projectQuery, setProjectQuery] = useState('');

	const variant = location.pathname.startsWith('/explorer') ? 'explorer' : 'home';

	const projects: Project[] = [
		{ id: '1', name: projectName || 'Reusable workspace', branch: 'main', description: 'Main project workspace' },
	];

	const filteredProjects = useMemo(() => {
		const query = projectQuery.trim().toLowerCase();
		if (!query) return projects;
		return projects.filter(p => 
			p.name.toLowerCase().includes(query) || 
			p.branch.toLowerCase().includes(query)
		);
	}, [projectQuery, projects]);

	const currentProjectName = projectName || 'Reusable workspace';

	return (
		<header className="relative z-50 flex-shrink-0 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-sm">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-6 text-sm text-slate-600">
					<img src={workspaceLogo} alt="Workspace logo" className="h-10 w-auto shrink-0" />

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => navigate('/')}
							className="flex items-center gap-2 rounded-full px-2 py-1 cursor-pointer text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
						>
							<FolderOpen className="h-4 w-4" />
							<span className="font-medium">Projects</span>
						</button>

						<span className="text-slate-300">/</span>
						<span className="font-bold text-slate-900">{currentProjectName}</span>
					

						<div className="relative">
							<button
								type="button"
								onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
								className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600 transition-colors hover:text-slate-900"
							>
								Switch project
								<ChevronDown className={`h-3.5 w-3.5 transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
							</button>
							{isProjectMenuOpen ? (
								<div className="absolute left-0 top-full z-[70] mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-200/80">
									<div className="mb-3">
										<div className="relative">
											<Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
											<input
												type="search"
												value={projectQuery}
												onChange={event => setProjectQuery(event.target.value)}
												placeholder="Search projects"
												className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
											/>
										</div>
									</div>
									<div className="max-h-60 space-y-1 overflow-auto pr-1">
										{filteredProjects.map(project => (
											<button
												key={project.id}
												type="button"
												onClick={() => {
													setProjectName(project.name);
													setIsProjectMenuOpen(false);
													navigate('/explorer');
												}}
												className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50"
											>
												<div>
													<p className="text-sm font-medium text-slate-900">{project.name}</p>
													<p className="text-xs text-slate-500">{project.branch}</p>
												</div>
											</button>
										))}
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
