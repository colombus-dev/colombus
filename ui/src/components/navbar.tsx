import { ChevronRight, LogOut } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { PATH } from "@/lib/constants";

export interface NavbarProps {
	isOnProject: boolean;
	projectName?: string;
	authRequired: boolean;
	onLogout: () => void;
}

export const Navbar = ({
	isOnProject,
	projectName,
	authRequired,
	onLogout,
}: NavbarProps) => {
	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
			<div className="flex h-14 w-full items-center gap-3 px-4">
				<Link
					to={PATH.HOME}
					className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					<img
						src={`${import.meta.env.BASE_URL}logo.png`}
						alt=""
						className="size-7 rounded-md object-cover"
					/>
					<span className="font-semibold tracking-tight">Colombus</span>
				</Link>

				<span aria-hidden="true" className="h-5 w-px bg-border" />

				<nav aria-label="Breadcrumb" className="min-w-0">
					<ol className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
						<li>
							{isOnProject ? (
								<Link
									to={PATH.HOME}
									className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
								>
									Projects
								</Link>
							) : (
								<span
									aria-current="page"
									className="font-medium text-foreground"
								>
									Projects
								</span>
							)}
						</li>
						{isOnProject && (
							<>
								<li aria-hidden="true">
									<ChevronRight className="size-3.5" />
								</li>
								<li className="min-w-0">
									{projectName !== undefined ? (
										<span
											aria-current="page"
											title={projectName}
											className="block max-w-[40ch] truncate font-medium text-foreground"
										>
											{projectName}
										</span>
									) : (
										<span className="block h-4 w-24 animate-pulse rounded bg-muted" />
									)}
								</li>
							</>
						)}
					</ol>
				</nav>

				{authRequired && (
					<Button
						variant="ghost"
						size="sm"
						className="ml-auto text-muted-foreground"
						onClick={onLogout}
					>
						<LogOut />
						Log out
					</Button>
				)}
			</div>
		</header>
	);
};
