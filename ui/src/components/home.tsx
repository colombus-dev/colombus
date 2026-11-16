import { isCancel } from "axios";
import { ArrowDownAZ, ArrowDownZA, FolderOpen, SearchX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Project } from "@/api/client";
import { getAllProjects, renameProject } from "@/api/client";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "./project-card";
import { ProjectCreateDialog } from "./project-create-dialog";
import { ProjectDeleteDialog } from "./project-delete-dialog";
import { ProjectNameDialog } from "./project-name-dialog";
import { ProjectSearchInput } from "./project-search-input";

type LoadState = "loading" | "ready" | "error";
type SortOrder = "asc" | "desc";
type ProjectAction = { kind: "rename" | "delete"; project: Project };

const HIGHLIGHT_DURATION_MS = 4000;
const SKELETON_KEYS = ["a", "b", "c", "d", "e", "f"];
const nameCollator = new Intl.Collator(undefined, { sensitivity: "base" });

export default function Home() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [loadState, setLoadState] = useState<LoadState>("loading");
	const [search, setSearch] = useState("");
	const [highlightedId, setHighlightedId] = useState<string | null>(null);
	const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
	const [action, setAction] = useState<ProjectAction | null>(null);
	const [isActionOpen, setIsActionOpen] = useState(false);

	useEffect(() => {
		const controller = new AbortController();
		getAllProjects(controller.signal)
			.then((data) => {
				setProjects(data);
				setLoadState("ready");
			})
			.catch((err) => {
				if (isCancel(err)) {
					return;
				}
				console.error(err);
				setLoadState("error");
			});
		return () => controller.abort();
	}, []);

	useEffect(() => {
		if (highlightedId === null) {
			return;
		}
		const timer = setTimeout(
			() => setHighlightedId(null),
			HIGHLIGHT_DURATION_MS,
		);
		return () => clearTimeout(timer);
	}, [highlightedId]);

	const sortedProjects = useMemo(() => {
		const direction = sortOrder === "asc" ? 1 : -1;
		return [...projects].sort(
			(a, b) => direction * nameCollator.compare(a.name, b.name),
		);
	}, [projects, sortOrder]);

	const query = search.trim().toLowerCase();
	const visibleProjects =
		query === ""
			? sortedProjects
			: sortedProjects.filter((p) => p.name.toLowerCase().includes(query));

	const openAction = (kind: ProjectAction["kind"], project: Project) => {
		setAction({ kind, project });
		setIsActionOpen(true);
	};

	const handleCreated = (project: Project) => {
		setSearch("");
		setHighlightedId(project.id);
		setProjects((current) => [...current, project]);
	};

	const handleRename = async (name: string) => {
		if (action === null || name === action.project.name) {
			return;
		}
		const projectId = action.project.id;
		const newName = await renameProject(projectId, name);
		toast.success(`Project renamed to "${newName}".`);
		setProjects((current) =>
			current.map((p) => (p.id === projectId ? { ...p, name: newName } : p)),
		);
	};

	const handleDeleted = (projectId: string) => {
		setProjects((current) => current.filter((p) => p.id !== projectId));
	};

	const sortLabel = sortOrder === "asc" ? "Sorted A to Z" : "Sorted Z to A";

	const renderContent = () => {
		if (loadState === "loading") {
			return (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{SKELETON_KEYS.map((key) => (
						<div
							key={key}
							className="h-[58px] animate-pulse rounded-xl border bg-card"
						/>
					))}
				</div>
			);
		}
		if (loadState === "error") {
			return (
				<EmptyState
					icon={<FolderOpen className="size-5" />}
					title="Could not load projects"
					description="Check your connection and reload the page."
				/>
			);
		}
		if (projects.length === 0) {
			return (
				<EmptyState
					icon={<FolderOpen className="size-5" />}
					title="No projects yet"
					description="Create your first project with the New project button."
				/>
			);
		}
		if (visibleProjects.length === 0) {
			return (
				<EmptyState
					icon={<SearchX className="size-5" />}
					title="No matching projects"
					description={`Nothing matches "${search.trim()}".`}
				/>
			);
		}
		return (
			<>
				<p className="mb-3 text-xs font-medium text-muted-foreground">
					{visibleProjects.length}{" "}
					{visibleProjects.length === 1 ? "project" : "projects"}
				</p>
				<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{visibleProjects.map((project) => (
						<li key={project.id}>
							<ProjectCard
								project={project}
								highlighted={project.id === highlightedId}
								onRename={(p) => openAction("rename", p)}
								onDelete={(p) => openAction("delete", p)}
							/>
						</li>
					))}
				</ul>
			</>
		);
	};

	return (
		<section className="h-full overflow-y-auto bg-background">
			<div className="mx-auto w-full max-w-5xl px-6 py-10">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Open a project to explore its profiles and patterns.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<ProjectSearchInput value={search} onChange={setSearch} />
						<Button
							variant="outline"
							size="icon"
							aria-label={`${sortLabel}, click to reverse`}
							title={`${sortLabel}, click to reverse`}
							onClick={() =>
								setSortOrder((order) => (order === "asc" ? "desc" : "asc"))
							}
						>
							{sortOrder === "asc" ? <ArrowDownAZ /> : <ArrowDownZA />}
						</Button>
						<ProjectCreateDialog onCreated={handleCreated} />
					</div>
				</div>

				<div className="mt-8">{renderContent()}</div>
			</div>

			{action !== null && action.kind === "rename" && (
				<ProjectNameDialog
					key={action.project.id}
					open={isActionOpen}
					onOpenChange={setIsActionOpen}
					title="Rename project"
					description="Enter a new name for this project."
					submitLabel="Save"
					pendingLabel="Saving..."
					defaultName={action.project.name}
					onSubmit={handleRename}
				/>
			)}
			{action !== null && action.kind === "delete" && (
				<ProjectDeleteDialog
					key={action.project.id}
					project={action.project}
					open={isActionOpen}
					onOpenChange={setIsActionOpen}
					onDeleted={handleDeleted}
				/>
			)}
		</section>
	);
}

interface EmptyStateProps {
	icon: React.ReactNode;
	title: string;
	description: string;
}

const EmptyState = ({ icon, title, description }: EmptyStateProps) => (
	<div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
		<div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
			{icon}
		</div>
		<p className="font-medium">{title}</p>
		<p className="mt-1 text-sm text-muted-foreground">{description}</p>
	</div>
);
