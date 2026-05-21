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
					<ProfileExplorerGraphSettingsBar className="absolute top-6 right-12 w-56 flex flex-col pointer-events-auto z-10" />
					<GraphControls
						graphRenderer={graphRenderer}
						className="absolute bottom-6 right-12 pointer-events-auto z-10"
					/>
				</>
			)}
		</div>
	);
}
