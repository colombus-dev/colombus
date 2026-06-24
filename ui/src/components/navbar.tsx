import { Folder } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { PATH } from "@/lib/constants";

export interface NavbarProps {
	isOnProject: boolean;
	projectName?: string;
	onLogout: () => void;
}

export const Navbar = ({ isOnProject, projectName, onLogout }: NavbarProps) => {
	return (
		<header className="border-grid sticky top-0 z-50 w-full border-b bg-white">
			<div className="flex h-14 items-center px-6 gap-4 w-full">
				<img
					src="/logo.png"
					alt="Colombus Logo"
					className="w-8 h-8 rounded-lg shadow-sm shrink-0 object-cover"
				/>

				<div className="flex items-center gap-3 text-sm">
					<Link
						to={PATH.HOME}
						className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
					>
						<Folder className="w-4 h-4" />
						<span>Projects</span>
					</Link>

					{isOnProject && (
						<>
							<span className="text-slate-300 font-light">/</span>
							<span className="font-semibold text-slate-700">
								{projectName}
							</span>
						</>
					)}
				</div>

				<Button
					variant="ghost"
					size="sm"
					className="ml-auto text-slate-500 hover:text-slate-900"
					onClick={onLogout}
				>
					Logout
				</Button>
			</div>
		</header>
	);
};
