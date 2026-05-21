import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
		dedupe: ["react", "react-dom"],
	},
	server: {
		allowedHosts: ["erebe-vm9.i3s.unice.fr"],
	},
	preview: {
		allowedHosts: ["erebe-vm9.i3s.unice.fr"],
	},
});
