import { LocateFixed, ZoomIn, ZoomOut } from "lucide-react"
import type Sigma from "sigma"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface GraphControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  graphRenderer?: Sigma
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
              onClick={() => graphRenderer?.getCamera().animatedZoom()}
            >
              <ZoomIn />
            </Button>
          }
        />
        <TooltipContent>
          <p>Zoom In</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              onClick={() => graphRenderer?.getCamera().animatedUnzoom()}
            >
              <ZoomOut />
            </Button>
          }
        />
        <TooltipContent>
          <p>Zoom Out</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
