import { Loader2 } from "lucide-react";
import type { Sigma } from "sigma";
import { cn } from "@/lib/utils";
import GraphControls from "./graph-controls";
import ProfileExplorerGraphSettingsBar from "./profile-explorer-graph-settings-bar";

interface GraphContainerProps {
	containerId: string;
	isLoading: boolean;
	graphRenderer?: Sigma;
	errorMessage?: string | null;
	emptyMessage?: string | null;
}

export default function GraphContainer({
	containerId,
	isLoading,
	graphRenderer,
	errorMessage = null,
	emptyMessage = null,
	className,
	...props
}: GraphContainerProps & React.HTMLAttributes<HTMLDivElement>) {
	const message = errorMessage ?? emptyMessage;
	return (
		<div {...props} className={cn("relative", className)}>
			<div
				className="h-full w-full overflow-hidden rounded-xl border bg-card"
				id={containerId}
			/>
			{isLoading && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<Loader2
						aria-label="Loading"
						className="size-6 animate-spin text-muted-foreground"
					/>
				</div>
			)}
			{!isLoading && message !== null && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
					<p
						role={errorMessage !== null ? "alert" : undefined}
						className={cn(
							"max-w-sm text-center text-sm",
							errorMessage !== null
								? "text-destructive"
								: "text-muted-foreground",
						)}
					>
						{message}
					</p>
				</div>
			)}
			<ProfileExplorerGraphSettingsBar className="absolute right-4 bottom-4 z-10 max-h-[calc(100%-2rem)] w-64 rounded-xl border bg-card/95 p-4 shadow-sm backdrop-blur-sm" />
			<GraphControls
				graphRenderer={graphRenderer}
				className="absolute right-70 bottom-4 z-10 rounded-xl border bg-card/95 p-1 shadow-sm backdrop-blur-sm"
			/>
		</div>
	);
}
