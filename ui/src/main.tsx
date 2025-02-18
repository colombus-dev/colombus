import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App.tsx";
import { Toaster } from "@/components/ui/sonner";
import EditorPage from "@/pages/editor";
import ExplorerPage from "@/pages/explorer";
import RootLayout from "@/root-layout";
import { BrowserRouter, Route, Routes } from "react-router";
import RequireProject from "./RequireProject";

// biome-ignore lint/style/noNonNullAssertion: TODO
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route element={<RootLayout />}>
					<Route index element={<App />} />
					<Route
						path="/explorer"
						element={
							<RequireProject>
								<ExplorerPage />
							</RequireProject>
						}
					/>
					<Route
						path="/editor"
						element={
							<RequireProject>
								<EditorPage />
							</RequireProject>
						}
					/>
				</Route>
			</Routes>
		</BrowserRouter>
		<Toaster />
	</StrictMode>,
);
