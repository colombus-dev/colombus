import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App.tsx";
import { Toaster } from "@/components/ui/sonner";
import EditorPage from "@/pages/editor";
import ExplorerPage from "@/pages/explorer";
import RootLayout from "@/root-layout";
import { BrowserRouter, Route, Routes } from "react-router";

// biome-ignore lint/style/noNonNullAssertion: TODO
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route element={<RootLayout />}>
					<Route index element={<App />} />
					<Route path="/explorer" element={<ExplorerPage />} />
					<Route path="/editor" element={<EditorPage />} />
				</Route>
			</Routes>
		</BrowserRouter>
		<Toaster />
	</StrictMode>,
);
