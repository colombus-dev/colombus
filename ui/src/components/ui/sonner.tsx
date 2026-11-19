import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/components/theme-provider";

export function Toaster() {
	const { theme } = useTheme();
	return (
		<Sonner
			theme={theme}
			position="bottom-right"
			richColors
			closeButton
			toastOptions={{ classNames: { icon: "hidden!" } }}
		/>
	);
}
