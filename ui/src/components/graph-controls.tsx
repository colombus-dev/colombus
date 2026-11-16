import { LocateFixed, ZoomIn, ZoomOut } from "lucide-react";
import type Sigma from "sigma";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface GraphControlsProps extends React.HTMLAttributes<HTMLDivElement> {
	graphRenderer?: Sigma;
}

export default function GraphControls({
	graphRenderer,
	...divProps
}: GraphControlsProps) {
	return (
		<div {...divProps} className={cn("flex flex-col", divProps.className)}>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Reset zoom"
							onClick={() => graphRenderer?.getCamera().animatedReset()}
						>
							<LocateFixed />
						</Button>
					}
				/>
				<TooltipContent>
					<p>Reset zoom</p>
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Zoom in"
							onClick={() => graphRenderer?.getCamera().animatedZoom()}
						>
							<ZoomIn />
						</Button>
					}
				/>
				<TooltipContent>
					<p>Zoom in</p>
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Zoom out"
							onClick={() => graphRenderer?.getCamera().animatedUnzoom()}
						>
							<ZoomOut />
						</Button>
					}
				/>
				<TooltipContent>
					<p>Zoom out</p>
				</TooltipContent>
			</Tooltip>
		</div>
	);
}
