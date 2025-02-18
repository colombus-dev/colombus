import { checkApiKey } from "@/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { Label } from "./ui/label";
import { useColombusStore } from "@/store";

const ProjectApiKeyForm: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const setApiKey = useColombusStore((state) => state.setApiKey);

	const handleApiKeyFormSubmit: React.FormEventHandler<HTMLFormElement> =
		useCallback(
			async (e) => {
				e.preventDefault();
				const userKey = ((e.target as HTMLFormElement)[0] as HTMLInputElement)
					.value;
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

	return (
		<div {...divProps} className={cn("space-x-1", divProps.className)}>
			<form onSubmit={handleApiKeyFormSubmit}>
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
	);
};

export default ProjectApiKeyForm;
