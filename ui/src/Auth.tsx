import { GoogleLogin } from "@react-oauth/google";
import { useEffect } from "react";
import { toast } from "sonner";
import { authGoogle } from "@/api/client";
import { useColombusStore } from "@/store";

export default function Auth({ children }: React.PropsWithChildren) {
	const jwtToken = useColombusStore((state) => state.jwtToken);
	const jwtExpiry = useColombusStore((state) => state.jwtExpiry);
	const setJwtToken = useColombusStore((state) => state.setJwtToken);

	useEffect(() => {
		if (!jwtToken || !jwtExpiry) return;

		if (Date.now() >= jwtExpiry) {
			setJwtToken(undefined);
			return;
		}

		const timer = setTimeout(
			() => setJwtToken(undefined),
			jwtExpiry - Date.now(),
		);
		return () => clearTimeout(timer);
	}, [jwtToken, jwtExpiry, setJwtToken]);

	const handleSuccess = async (response: any) => {
		try {
			const { jwt_token, exp } = await authGoogle(response.credential);
			setJwtToken(jwt_token, exp);
		} catch {
			toast.error("Login Failed");
		}
	};

	const isAuthenticated = !!jwtToken && !!jwtExpiry && Date.now() < jwtExpiry;

	return isAuthenticated ? (
		children
	) : (
		<div className="grid place-items-center h-screen">
			<div className="flex flex-col items-center gap-6 p-12 border rounded-lg shadow-sm">
				<h1 className="text-4xl font-extrabold tracking-tight">Colombus 🌄</h1>
				<p className="text-muted-foreground text-sm">Sign in to continue</p>
				<GoogleLogin
					onSuccess={handleSuccess}
					onError={() => toast.error("Login Failed")}
				/>
			</div>
		</div>
	);
}
