import { useEffect, useState } from "react";
import { getAllProjects } from "@/api/client";
import { ProjectCard } from "./project-card";
import { ProjectCreateForm } from "./project-create-form";
import { ProjectSearchInput } from "./project-search-input";

export default function Home() {
	const [projects, setProjects] = useState<
		{ id: string; name: string; description?: string | null }[]
	>([]);
	const [search, setSearch] = useState("");

	useEffect(() => {
		getAllProjects().then(setProjects).catch(console.error);
	}, []);

	const filteredProjects = projects.filter((p) =>
		p.name.toLowerCase().includes(search.toLowerCase()),
	);
	const displayProjects = search.trim() === "" ? projects : filteredProjects;

	return (
		<section className="flex flex-col items-center min-h-screen bg-slate-50 pt-16 pb-12 px-6">
			<div className="mb-16 flex items-center justify-center gap-6">
				<h1 className="text-5xl font-extrabold tracking-tight sm:text-[6rem] text-slate-900">
					Colombus
				</h1>
				<img
					src={`${import.meta.env.BASE_URL}logo.png`}
					alt="logo"
					className="w-16 h-16 sm:w-24 sm:h-24"
				/>
			</div>

			<div className="w-full max-w-[1100px] space-y-12">
				<ProjectCreateForm className="bg-transparent p-0 border-none shadow-none" />

				<div className="space-y-6">
					<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-slate-200 pt-8">
						<div>
							<h2 className="text-2xl font-bold text-slate-900">
								Existing projects
							</h2>
							<p className="text-sm text-slate-500 mt-1">
								Find an existing workspace to continue your work.
							</p>
						</div>
						<ProjectSearchInput value={search} onChange={setSearch} />
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar pb-4">
						{displayProjects.map((project) => (
							<ProjectCard key={project.id} project={project} />
						))}
						{displayProjects.length === 0 && (
							<div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
								No projects found.
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
