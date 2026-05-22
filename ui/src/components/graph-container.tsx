import BounceLoader from "react-spinners/BounceLoader";
import type { Sigma } from "sigma";
import GraphControls from "./graph-controls";
import ProfileExplorerGraphSettingsBar from "./profile-explorer-graph-settings-bar";

interface GraphContainerProps {
	containerId: string;
	isLoading: boolean;
	graphRenderer?: Sigma;
}

export default function GraphContainer({
	containerId,
	isLoading,
	graphRenderer,
	...props
}: GraphContainerProps & React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div {...props} className={props.className}>
			<div
				className="h-full border-gray-500 border"
				id={containerId}
				style={{ height: "99%", width: "98%" }}
			/>
			<BounceLoader
				className="absolute top-1/2 right-1/2"
				color="green"
				cssOverride={{ position: "absolute" }}
				loading={isLoading}
			/>
			{!isLoading && (
				<>
					<ProfileExplorerGraphSettingsBar className="absolute top-4 right-12 w-72 bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-[20px] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] z-10" />
					<GraphControls
						graphRenderer={graphRenderer}
						className="absolute bottom-3 right-12 bg-white bg-opacity-80"
					/>
				</>
			)}
		</div>
	);
}
