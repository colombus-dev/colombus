import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Outlet } from "react-router";
import RequireApiKey from "@/RequireApiKey";
import { Badge } from "@/components/ui/badge";
import { useColombusStore } from "@/store";

export default function RootLayout() {
	const projectName = useColombusStore((state) => state.projectName);
	return (
		<RequireApiKey>
			<div className="flex flex-col h-screen space-y-2">
				<header className="border-grid sticky top-0 z-50 w-full border-b bg-white">
					<div className="container-wrapper flex">
						<div className="container flex h-14 items-center">
							<div className="mr-4 md:flex space-x-10 p-5">
								<nav>
									<NavigationMenu>
										<NavigationMenuList className="space-x-5">
											<NavigationMenuItem>
												<NavigationMenuLink href="/">Home</NavigationMenuLink>
											</NavigationMenuItem>
											<NavigationMenuItem>
												<NavigationMenuLink href="/explorer">
													Explorer
												</NavigationMenuLink>
											</NavigationMenuItem>
										</NavigationMenuList>
									</NavigationMenu>
								</nav>
							</div>
							<p className="font-bold">{projectName}</p>
						</div>
						<Badge className="w-[12vw] bg-green-600 m-2">
							MODE: {import.meta.env.VITE_INTERFACE_MODE}
						</Badge>
					</div>
				</header>
				<main className="flex-1">
					<Outlet />
				</main>
			</div>
		</RequireApiKey>
	);
}
