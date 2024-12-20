import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Outlet } from "react-router";

export default function RootLayout() {
	return (
		<div className="flex flex-col h-screen space-y-2">
			<header className="border-grid sticky top-0 z-50 w-full border-b">
				<div className="container-wrapper">
					<div className="container flex h-14 items-center">
						<div className="mr-4 md:flex">
							<a href="/">Colombus 🌄</a>
							<nav>
								<NavigationMenu>
									<NavigationMenuList>
										<NavigationMenuItem>
											<NavigationMenuLink href="/explorer">Explorer</NavigationMenuLink>
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
	);
}
