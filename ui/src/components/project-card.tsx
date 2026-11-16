import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router";
import type { Project } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PATH } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
	project: Project;
	highlighted?: boolean;
	onRename?: (project: Project) => void;
	onDelete?: (project: Project) => void;
}

export const ProjectCard = ({
	project,
	highlighted = false,
	onRename,
	onDelete,
}: ProjectCardProps) => {
	return (
		<div
			className={cn(
				"group relative flex items-center justify-between gap-2 rounded-xl border bg-card p-4 text-card-foreground shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-md has-[a:focus-visible]:border-foreground/25 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50",
				highlighted && "border-primary/40 ring-3 ring-primary/15",
			)}
		>
			<Link
				to={`${PATH.EXPLORER}/${project.id}`}
				className="min-w-0 truncate font-medium outline-none after:absolute after:inset-0 after:rounded-xl"
			>
				{project.name}
			</Link>
			{(onRename !== undefined || onDelete !== undefined) && (
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								variant="ghost"
								size="icon-xs"
								aria-label={`Actions for project ${project.name}`}
								className="relative z-10 -mr-1 text-muted-foreground"
							/>
						}
					>
						<Ellipsis />
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{onRename !== undefined && (
							<DropdownMenuItem onClick={() => onRename(project)}>
								<Pencil />
								Rename
							</DropdownMenuItem>
						)}
						{onDelete !== undefined && (
							<DropdownMenuItem
								variant="destructive"
								onClick={() => onDelete(project)}
							>
								<Trash2 />
								Delete project
							</DropdownMenuItem>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
};
