import { useEffect, useState } from "react";
import { updateHttpClientJwtToken } from "@/api/client";
import { useColombusStore } from "@/store";
import { ProjectCard } from "./project-card";
import { ProjectCreateForm } from "./project-create-form";
import { ProjectSearchInput } from "./project-search-input";

export default function Home() {
	const jwtToken = useColombusStore((state) => state.jwtToken);
	const [projects, setProjects] = useState<
		{ id: string; name: string; description?: string | null }[]
	>([]);
	const [search, setSearch] = useState("");

	useEffect(() => {
		if (jwtToken) {
			updateHttpClientJwtToken();

			const apiPath = import.meta.env.VITE_API_HOST;
			const apiPort = import.meta.env.VITE_API_PORT;
			const baseURL = apiPath
				? `${apiPath}${apiPort ? `:${apiPort}` : ""}/api`
				: "/api";

			fetch(`${baseURL}/project`, {
				headers: { "x-api-key": jwtToken },
				cache: "no-store",
			})
				.then((res) => {
					if (!res.ok) throw new Error("Failed to fetch projects");
					return res.json();
				})
				.then(setProjects)
				.catch(console.error);
		}
	}, [jwtToken]);

	const filteredProjects = projects.filter((p) =>
		p.name.toLowerCase().includes(search.toLowerCase()),
	);
	const displayProjects =
		search.trim() === "" ? projects.slice(0, 3) : filteredProjects;

	return (
		<section className="flex flex-col items-center min-h-screen bg-slate-50 pt-16 pb-12 px-6">
			<div className="bg-white rounded-[2rem] shadow-sm p-4 px-10 border border-slate-100 mb-16 flex items-center justify-center">
				<h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] text-slate-900 flex items-center gap-4">
					Colombus 🌄
				</h1>
			</div>

			<div className="w-full max-w-[800px] space-y-10">
				<div className="space-y-6">
					<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
						<div>
							<h2 className="text-2xl font-bold text-slate-900">
								Your projects
							</h2>
							<p className="text-sm text-slate-500 mt-1">
								Start from an existing workspace or create a new one from the
								form below.
							</p>
						</div>
						<ProjectSearchInput value={search} onChange={setSearch} />
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{displayProjects.map((project, index) => (
							<ProjectCard
								key={project.id}
								project={project}
								isActive={index === 0 && search.trim() === ""}
							/>
						))}
						{displayProjects.length === 0 && (
							<div className="col-span-3 text-center py-12 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
								No projects found.
							</div>
						)}
					</div>
				</div>

				<ProjectCreateForm />
			</div>
		</section>
	);
}
