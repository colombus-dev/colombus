import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LocateFixed, ZoomIn, ZoomOut } from "lucide-react";
import type Sigma from "sigma";

interface GraphControlsProps extends React.HTMLAttributes<HTMLDivElement> {
	graphRenderer?: Sigma;
}

export default function GraphControls({
	graphRenderer,
	...divProps
}: GraphControlsProps) {
	return (
		<div {...divProps} className={cn("flex flex-col", divProps.className)}>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							onClick={() => graphRenderer?.getCamera().animatedReset()}
						>
							<LocateFixed />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Reset zoom</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							onClick={() => graphRenderer?.getCamera().animatedZoom()}
						>
							<ZoomIn />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Zoom In</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							onClick={() => graphRenderer?.getCamera().animatedUnzoom()}
						>
							<ZoomOut />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Zoom Out</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
}
