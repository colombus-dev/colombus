import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		allowedHosts: ["erebe-vm9.i3s.unice.fr"],
	},
	preview: {
		allowedHosts: ["erebe-vm9.i3s.unice.fr"],
	},
});
