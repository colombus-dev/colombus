import { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useColombusStore } from '@/store';
import colombusLogo from '../prototype/src/imports/colombus.png';

interface Project {
	id: string;
	name: string;
	branch: string;
	description: string;
}

export default function App() {
	const navigate = useNavigate();
	const projectName = useColombusStore((state) => state.projectName);
	const setProjectName = useColombusStore((state) => state.setProjectName);
	
	const [searchQuery, setSearchQuery] = useState('');
	const [newProjectName, setNewProjectName] = useState('');

	// Mock projects for the main app home page
	const projects: Project[] = [
		{ id: 'reusable-workspace', name: 'Reusable workspace', branch: 'main', description: 'Main project workspace for data analysis.' },
		{ id: 'legacy-analysis', name: 'Legacy Analysis', branch: 'v1-archive', description: 'Archived project from previous quarter.' },
		{ id: 'ml-experiments', name: 'ML Experiments', branch: 'feat/models', description: 'Testing new machine learning models.' },
	];

	const filteredProjectCards = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return projects;
		return projects.filter(project =>
			[project.name, project.branch, project.description].join(' ').toLowerCase().includes(query)
		);
	}, [searchQuery]);

	const handleOpenProject = (project: Project) => {
		setProjectName(project.name);
		navigate(`/explorer`);
	};

	const handleCreateProject = () => {
		if (newProjectName.trim()) {
			setProjectName(newProjectName.trim());
			setNewProjectName('');
			navigate(`/explorer`);
		}
	};

	return (
		<div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900 overflow-x-hidden">

			<main className="flex-1 overflow-y-auto px-5 py-8">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
					<section className="flex min-h-[220px] items-center justify-center px-6 py-8">
						<img
							src={colombusLogo}
							alt="Colombus logo"
							className="max-h-[180px] w-auto max-w-full rounded-[1.5rem] object-contain shadow-[0_18px_36px_rgba(15,23,42,0.14)] sm:max-h-[220px]"
						/>
					</section>

					<section>
						<div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
							<div>
								<h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Your projects</h1>
								<p className="mt-2 max-w-2xl text-sm text-slate-600">
									Start from an existing workspace or create a new one from the form below.
								</p>
							</div>
							<div className="relative w-full sm:w-72 shrink-0">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
								<input
									type="search"
									placeholder="Search projects..."
									value={searchQuery}
									onChange={e => setSearchQuery(e.target.value)}
									className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 shadow-sm"
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{filteredProjectCards.map(project => (
								<button
									key={project.id}
									type="button"
									onClick={() => handleOpenProject(project)}
									className="group w-full cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
								>
									<div className="mb-4 flex items-start justify-between gap-4">
										<div>
											<p className="text-lg font-semibold text-slate-950">{project.name}</p>
											<p className="mt-1 text-sm text-slate-500">{project.branch}</p>
										</div>
										{project.name === projectName ? (
											<span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
												Active
											</span>
										) : null}
									</div>
									<p className="text-sm leading-6 text-slate-600">{project.description}</p>
									<div className="mt-4 flex items-center gap-1 text-sm font-medium text-slate-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
										<span>Open project</span>
										<ChevronRight className="h-4 w-4" />
									</div>
								</button>
							))}
						</div>
						{filteredProjectCards.length === 0 ? (
							<div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
								<Search className="mb-4 h-8 w-8 text-slate-300" />
								<p className="text-sm font-medium text-slate-900">No projects found</p>
								<p className="mt-1 text-sm text-slate-500">We couldn't find anything matching "{searchQuery}".</p>
							</div>
						) : null}
					</section>

					<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
						<h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Create project</h2>
						<p className="mt-2 text-sm text-slate-600">Enter a project name, then create it directly from here.</p>

						<div className="mt-5 flex flex-col gap-3 sm:flex-row">
							<div className="flex-1">
								<input
									type="text"
									value={newProjectName}
									onChange={event => setNewProjectName(event.target.value)}
									onKeyDown={event => {
										if (event.key === 'Enter') {
											handleCreateProject();
										}
									}}
									placeholder="Type a project name"
									className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
								/>
							</div>

							<button
								type="button"
								onClick={handleCreateProject}
								className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
							>
								Create project
							</button>
						</div>
					</section>
				</div>
			</main>
		</div>
	);
}
