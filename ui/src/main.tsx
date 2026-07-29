import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "@/App.tsx";
import { getAuthConfig } from "@/api/client";
import Home from "@/components/home.tsx";
import { PATH } from "@/lib/constants";
import ExplorerProjectIdPage from "@/pages/explorer/:projectId";

const NotFound = () => (
	<div className="flex flex-col items-center justify-center h-full space-y-4">
		<h1 className="text-4xl font-bold">404</h1>
		<p className="text-lg text-slate-500">Page not found</p>
	</div>
);

async function bootstrap() {
	const googleClientId = await getAuthConfig();

	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<GoogleOAuthProvider clientId={googleClientId}>
				<BrowserRouter basename={import.meta.env.BASE_URL}>
					<Routes>
						<Route element={<App />}>
							<Route index element={<Home />} />
							<Route path={PATH.HOME} element={<Home />} />
							<Route
								path={`${PATH.EXPLORER}/:projectId`}
								element={<ExplorerProjectIdPage />}
							/>
							<Route path="*" element={<NotFound />} />
						</Route>
					</Routes>
				</BrowserRouter>
			</GoogleOAuthProvider>
		</StrictMode>,
	);
}

bootstrap();
