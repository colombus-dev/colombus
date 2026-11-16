import { BounceLoader } from "react-spinners";
import type { Sigma } from "sigma";
import GraphControls from "./graph-controls";
import ProfileExplorerGraphSettingsBar from "./profile-explorer-graph-settings-bar";

interface GraphContainerProps {
	containerId: string;
	isLoading: boolean;
	graphRenderer?: Sigma;
	errorMessage?: string | null;
}

export default function GraphContainer({
	containerId,
	isLoading,
	graphRenderer,
	errorMessage,
	...props
}: GraphContainerProps & React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div {...props} className={props.className}>
			<div
				className="h-full w-full overflow-hidden rounded-xl border bg-card"
				id={containerId}
			/>
			<BounceLoader
				className="absolute top-1/2 right-1/2"
				color="green"
				cssOverride={{ position: "absolute" }}
				loading={isLoading}
			/>
			{errorMessage && !isLoading && (
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold text-xl bg-white p-4 rounded-lg shadow-lg border border-red-200 z-50">
					{errorMessage}
				</div>
			)}
			{!isLoading && !errorMessage && (
				<>
					<ProfileExplorerGraphSettingsBar className="absolute right-4 bottom-4 z-10 max-h-[calc(100%-2rem)] w-64 rounded-xl border bg-card/95 p-4 shadow-sm backdrop-blur-sm" />
					<GraphControls
						graphRenderer={graphRenderer}
						className="absolute right-70 bottom-4 z-10 rounded-xl border bg-card/95 p-1 shadow-sm backdrop-blur-sm"
					/>
				</>
			)}
		</div>
	);
}
