/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_HOST: string;
	readonly VITE_API_PORT: string;
	readonly VITE_INTERFACE_MODE: "full" | "limited" | "user-experiment";
	readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
