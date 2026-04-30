import { Outlet } from "react-router";
import RequireApiKey from "@/RequireApiKey";
import { WorkspaceHeader } from "@/components/WorkspaceHeader";

export default function RootLayout() {
	return (
		<RequireApiKey>
			<div className="flex flex-col h-screen overflow-hidden">
				<WorkspaceHeader />
				<main className="flex-1 overflow-hidden">
					<Outlet />
				</main>
			</div>
		</RequireApiKey>
	);
}
