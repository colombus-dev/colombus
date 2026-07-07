import { Loader2, Play, RotateCcw, Save } from "lucide-react";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";

export interface ProfilePatternActionsProps
	extends React.HTMLAttributes<HTMLDivElement> {
	onExecute?: () => void;
	onSave?: () => void;
	isExecuting?: boolean;
	isDirty?: boolean;
}

const ProfilePatternActions: React.FunctionComponent<
	ProfilePatternActionsProps
> = ({ onExecute, onSave, isExecuting, isDirty, ...divProps }) => {
	const currentPattern = useColombusStore((state) => state.currentPattern);
	const resetCurrentPattern = useColombusStore(
		(state) => state.resetCurrentPattern,
	);

	const { projectId } = useParams<{ projectId: string }>();

	return (
		<div {...divProps} className={cn("flex", divProps.className)}>
			<Button
				variant="ghost"
				onClick={onExecute}
				disabled={!projectId || isExecuting}
			>
				{isExecuting ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<Play className="mr-2 h-4 w-4" />
				)}{" "}
				Execute pattern
			</Button>
			<Button
				variant="ghost"
				onClick={resetCurrentPattern}
				disabled={currentPattern === undefined}
			>
				<RotateCcw className="mr-2 h-4 w-4" /> Reset pattern
			</Button>
			<Button
				variant="ghost"
				onClick={onSave}
				disabled={!projectId || isExecuting}
			>
				<Save className="mr-2 h-4 w-4" /> Save pattern
				{isDirty && (
					<span className="ml-1 text-orange-500 text-lg leading-none mt-1">
						*
					</span>
				)}
			</Button>
		</div>
	);
};

export default ProfilePatternActions;
