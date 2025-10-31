import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "@/App.tsx";
import { Toaster } from "@/components/ui/sonner";
import ExplorerPage from "@/pages/explorer";
import ExplorerProjectIdPage from "@/pages/explorer/:projectId";
import RootLayout from "@/root-layout";

// biome-ignore lint/style/noNonNullAssertion: TODO
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route element={<RootLayout />}>
					<Route index element={<App />} />
					<Route path="explorer">
						<Route index element={<ExplorerPage />} />
						<Route path=":projectId" element={<ExplorerProjectIdPage />} />
					</Route>
				</Route>
			</Routes>
		</BrowserRouter>
		<Toaster richColors />
	</StrictMode>,
);
