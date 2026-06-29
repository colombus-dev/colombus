import { Outlet, useLocation } from "react-router";
import Auth from "@/Auth.tsx";
import { Navbar } from "@/components/navbar";
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
				<Navbar
					isOnProject={isOnProject}
					projectName={projectName}
					onLogout={() => setJwtToken(undefined)}
				/>
				<main className="flex-1">
					<Outlet />
				</main>
			</div>
		</Auth>
	);
}
