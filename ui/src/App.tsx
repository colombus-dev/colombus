import {Outlet} from "react-router";
import {Badge} from "@/components/ui/badge";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import Auth from "@/Auth.tsx";
import {useColombusStore} from "@/store";
import {PATH} from "@/lib/constants";

export default function App() {
    const projectName = useColombusStore((state) => state.projectName);
    return (
        <Auth>
            <div className="flex flex-col h-screen space-y-2">
                <header className="border-grid sticky top-0 z-50 w-full border-b bg-white">
                    <div className="container-wrapper flex">
                        <div className="container flex h-14 items-center">
                            <div className="mr-4 md:flex space-x-10 p-5">
                                <nav>
                                    <NavigationMenu>
                                        <NavigationMenuList className="space-x-5">
                                            <NavigationMenuItem>
                                                <NavigationMenuLink href={PATH.HOME}>Home</NavigationMenuLink>
                                            </NavigationMenuItem>
                                            <NavigationMenuItem>
                                                <NavigationMenuLink href={PATH.EXPLORER}>
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
                    <Outlet/>
                </main>
            </div>
        </Auth>
    );
}
