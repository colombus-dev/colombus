import { Outlet, useLocation } from "react-router";
import Auth from "@/Auth.tsx";
import { Button } from "@/components/ui/button";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { PATH } from "@/lib/constants";
import { useColombusStore } from "@/store";

export default function App() {
	const projectName = useColombusStore((state) => state.projectName);
	const setJwtToken = useColombusStore((state) => state.setJwtToken);
	const location = useLocation();
	const isOnProject = location.pathname.startsWith(`${PATH.EXPLORER}/`);

	return (
		<Auth>
			<div className="flex flex-col h-screen space-y-2">
				<header className="border-grid sticky top-0 z-50 w-full border-b bg-white">
					<div className="flex h-14 items-center px-6 gap-6 w-full">
							<nav>
								<NavigationMenu>
									<NavigationMenuList className="space-x-5">
										<NavigationMenuItem>
											<NavigationMenuLink href={PATH.HOME}>
												Home
											</NavigationMenuLink>
										</NavigationMenuItem>
										<NavigationMenuItem>
											<NavigationMenuLink href={PATH.EXPLORER}>
												Explorer
											</NavigationMenuLink>
										</NavigationMenuItem>
									</NavigationMenuList>
								</NavigationMenu>
							</nav>
							{isOnProject && (
								<p className="font-bold">{projectName}</p>
							)}
							<Button
								variant="ghost"
								size="sm"
								className="ml-auto"
								onClick={() => setJwtToken(undefined)}
							>
								Logout
							</Button>
					</div>
				</header>
				<main className="flex-1">
					<Outlet />
				</main>
			</div>
		</Auth>
	);
}
