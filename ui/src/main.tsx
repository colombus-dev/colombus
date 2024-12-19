import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App.tsx";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Route, Routes } from "react-router";

// biome-ignore lint/style/noNonNullAssertion: TODO
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<App />} />
			</Routes>
		</BrowserRouter>
		<Toaster />
	</StrictMode>,
);
