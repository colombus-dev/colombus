import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Home from "@/components/home.tsx";
import ExplorerPage from "@/pages/explorer";
import ExplorerProjectIdPage from "@/pages/explorer/:projectId";
import App from "@/App.tsx";
import { PATH } from "@/lib/constants";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { getAuthConfig } from "@/api/client";

async function bootstrap() {
	const googleClientId = await getAuthConfig();

	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<GoogleOAuthProvider clientId={googleClientId}>
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
			</GoogleOAuthProvider>
		</StrictMode>,
	);
}

bootstrap();
