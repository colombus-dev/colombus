import BounceLoader from "react-spinners/BounceLoader";
import type { Sigma } from "sigma";
import GraphControls from "./graph-controls";
import ProfileExplorerGraphSettingsBar from "./profile-explorer-graph-settings-bar";

interface GraphContainerProps {
	containerId: string;
	isLoading: boolean;
	graphRenderer?: Sigma;
	stepNames?: string[];
}

export default function GraphContainer({
	containerId,
	isLoading,
	graphRenderer,
	stepNames,
	...props
}: GraphContainerProps & React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div {...props} className={props.className}>
			<div
				className="h-full border-gray-500 border"
				id={containerId}
			/>
			<BounceLoader
				className="absolute top-1/2 right-1/2"
				color="green"
				cssOverride={{ position: "absolute" }}
				loading={isLoading}
			/>
			{!isLoading && (
				<>
					<ProfileExplorerGraphSettingsBar
						className="absolute top-0 right-6 m-3 bg-white bg-opacity-80 p-2"
						stepNames={stepNames}
					/>
					<GraphControls
						graphRenderer={graphRenderer}
						className="absolute bottom-3 right-6 bg-white bg-opacity-80"
					/>
				</>
			)}
		</div>
	);
}
