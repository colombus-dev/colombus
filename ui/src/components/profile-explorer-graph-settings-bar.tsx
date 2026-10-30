import ProjectTaxonomyList from "@/components/project-taxonomy-list"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useColombusStore } from "@/store"

const ProfileExplorerGraphSettingsBar: React.FunctionComponent<
  React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
  const referenceDiffProfile = useColombusStore(
    (state) => state.referenceDiffProfile
  )
  const currentPattern = useColombusStore((state) => state.currentPattern)
  const setDisplayedLevel = useColombusStore((state) => state.setDisplayedLevel)
  const useWeightedNodes = useColombusStore((state) => state.useWeightedNodes)
  const setUseWeightedNodes = useColombusStore(
    (state) => state.setUseWeightedNodes
  )
  const patternCapturedNodesDisplayMode = useColombusStore(
    (state) => state.patternCapturedNodesDisplayMode
  )
  const setPatternCapturedNodesDisplayMode = useColombusStore(
    (state) => state.setPatternCapturedNodesDisplayMode
  )

  return (
    <div
      {...divProps}
      className={`flex flex-col h-full overflow-hidden space-y-4 ${divProps.className ?? ""}`}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="font-bold">Displayed levels:</p>
          <Select
            onValueChange={(v) =>
              setDisplayedLevel(Number.parseInt(v ?? "2", 10))
            }
            defaultValue="2"
          >
            <SelectTrigger>
              <SelectValue placeholder="Level to display" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Level to display</SelectLabel>
                <SelectItem key="1" value="1">
                  Workflow
                </SelectItem>
                <SelectItem key="2" value="2">
                  Step
                </SelectItem>
                <SelectItem key="3" value="3">
                  MetaInstruction
                </SelectItem>
                <SelectItem key="4" value="4">
                  Code
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <p className="font-bold">Customization:</p>
          <div className="flex flex-col space-y-2.5">
            <div
              className="flex items-center gap-3"
              key="check-weighted-nodes-div"
            >
              <Checkbox
                id="check-weighted-nodes"
                checked={useWeightedNodes}
                onCheckedChange={(c) => setUseWeightedNodes(!!c)}
              />
              <Label htmlFor="check-weighted-nodes">Use weighted nodes</Label>
            </div>
            <RadioGroup
              key="radio-ppm-nodes-display-div"
              value={patternCapturedNodesDisplayMode}
              onValueChange={(value) =>
                setPatternCapturedNodesDisplayMode(value)
              }
              disabled={!referenceDiffProfile && !currentPattern}
              className="w-fit"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="show-all" id="show-all" />
                <Label htmlFor="show-all">Show all nodes</Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="show-fixed" id="show-fixed" />
                <Label htmlFor="show-fixed">Show fixed nodes</Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="show-variable" id="show-variable" />
                <Label htmlFor="show-variable">Show variable nodes</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
      <ProjectTaxonomyList className="flex-1 min-h-0 mt-1" />
    </div>
  )
}

export default ProfileExplorerGraphSettingsBar
