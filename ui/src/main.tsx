import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "@/App.tsx";
import { getAuthConfig } from "@/api/client";
import Home from "@/components/home.tsx";
import { PATH } from "@/lib/constants";
import ExplorerPage from "@/pages/explorer";
import ExplorerProjectIdPage from "@/pages/explorer/:projectId";

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
