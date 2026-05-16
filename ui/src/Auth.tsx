import { useCallback } from "react";
import { toast } from "sonner";
import { checkApiKey } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useColombusStore } from "@/store";

export default function Auth({ children }: React.PropsWithChildren) {
	const apiKey = useColombusStore((state) => state.apiKey);
	const setApiKey = useColombusStore((state) => state.setApiKey);

	const handleApiKeyFormSubmit = useCallback(
		async (formData: FormData) => {
			const userKey = formData.get("api-key-form")?.toString();
			if (!userKey) {
				return;
			}
			await checkApiKey(userKey)
				.then(() => {
					toast.success("API Key is valid.");
					setApiKey(userKey);
				})
				.catch((r) => {
					toast.error(r.response.data.detail);
				});
		},
		[setApiKey],
	);

	return apiKey ? (
		children
	) : (
		<section className="grid grid-cols-3 grid-rows-5 space-x-4 h-full">
			<div className="col-start-2 col-span-1 row-start-2 row-span-1">
				<form action={handleApiKeyFormSubmit}>
					<div className="grid w-full max-w-sm items-center gap-1.5">
						<Label htmlFor="api-key-form">Enter the API Key</Label>
						<Input
							id="api-key-form"
							name="api-key-form"
							required
							placeholder="Enter API key"
						/>
						<Button type="submit">Enter Key</Button>
					</div>
				</form>
			</div>
		</section>
	);
}
