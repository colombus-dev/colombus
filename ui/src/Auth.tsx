import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { authGoogle, updateHttpClientApiKey } from "@/api/client";
import { useColombusStore } from "@/store";

export default function Auth({ children }: React.PropsWithChildren) {
  const apiKey = useColombusStore((state) => state.apiKey);
  const setApiKey = useColombusStore((state) => state.setApiKey);

  const handleSuccess = async (response: any) => {
    try {
      const data = await authGoogle(response.credential);
      setApiKey(data.api_key);
      updateHttpClientApiKey();
    } catch {
      toast.error(response.data.detail);
    }
  };

  return apiKey ? (
    <>{children}</>
  ) : (
    <div className="grid place-items-center h-screen">
      <div className="flex flex-col items-center gap-6 p-12 border rounded-lg shadow-sm">
        <h1 className="text-4xl font-extrabold tracking-tight">Colombus 🌄</h1>
        <p className="text-muted-foreground text-sm">Sign in to continue</p>
        <GoogleLogin onSuccess={handleSuccess} onError={() => toast.error("Login Failed")} />
      </div>
    </div>
  );
}
