import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
	base: process.env.VITE_BASE_PATH || "/",
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
		dedupe: ["react", "react-dom"],
	},
	server: {
		allowedHosts: true,
		proxy: {
			"/api": {
				target: process.env.VITE_PROXY_TARGET || "http://localhost:8180",
				changeOrigin: true,
			},
		},
	},
});
