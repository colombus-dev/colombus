import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Home from "@/components/home.tsx";
import ExplorerPage from "@/pages/explorer";
import ExplorerProjectIdPage from "@/pages/explorer/:projectId";
import App from "@/App.tsx";
import {PATH} from "@/lib/constants";

// biome-ignore lint/style/noNonNullAssertion: TODO
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route element={<App />}>
					<Route index element={<Home />} />
					<Route path={PATH.HOME} element={<Home />} />
					<Route path={PATH.EXPLORER}>
						<Route index element={<ExplorerPage />} />
						<Route path=":projectId" element={<ExplorerProjectIdPage />} />
					</Route>
				</Route>
			</Routes>
		</BrowserRouter>
	</StrictMode>,
);
