import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Outlet } from "react-router";
import RequireApiKey from "@/RequireApiKey";

export default function RootLayout() {
	return (
		<RequireApiKey>
			<div className="flex flex-col h-screen space-y-2">
				<header className="border-grid sticky top-0 z-50 w-full border-b bg-white">
					<div className="container-wrapper">
						<div className="container flex h-14 items-center">
							<div className="mr-4 md:flex space-x-10 p-5">
								<a href="/">Colombus 🌄</a>
								<nav>
									<NavigationMenu>
										<NavigationMenuList className="space-x-5">
											<NavigationMenuItem>
												<NavigationMenuLink href="/explorer">
													Explorer
												</NavigationMenuLink>
											</NavigationMenuItem>
										</NavigationMenuList>
									</NavigationMenu>
								</nav>
							</div>
						</div>
					</div>
				</header>
				<main className="flex-1">
					<Outlet />
				</main>
			</div>
		</RequireApiKey>
	);
}
