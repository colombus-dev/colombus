import { Button } from "@/components/ui/button";
import { cn, formatPatternGroup } from "@/lib/utils";
import { useColombusStore } from "@/store";
import { Separator } from "@/components/ui/separator";
import ProfilePatternGroupModal from "./profile-pattern-group-modal";
import { CirclePlus, Pencil, XCircle } from "lucide-react";
import { PatternGroup } from "@/lib/types";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

const ProfilePatternEditor: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const currentPattern = useColombusStore((state) => state.currentPattern);
	const setCurrentPattern = useColombusStore(
		(state) => state.setCurrentPattern,
	);
	const selectableSteps = currentPattern?.groups;
	// TODO: currently only supporting first pattern layer

	return (
		<div {...divProps} className={cn("flex space-x-1", divProps.className)}>
			{selectableSteps?.map((s, i) => (
				<div key={s?.name ?? "select"}>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger>
								<div className="border">
									<div>
										<p className="text-center">
											{s?.name ?? "Create new group"}
										</p>
									</div>
									<Separator />
									<div className="flex items-center">
										<ProfilePatternGroupModal
											value={s}
											onValueChange={(pe) => {
												setCurrentPattern({
													...currentPattern,
													groups:
														currentPattern?.groups?.map((e) =>
															e.name === s?.name ? pe : e,
														) ?? [],
												});
											}}
										>
											<Button variant="ghost" className="w-full">
												<Pencil />
											</Button>
										</ProfilePatternGroupModal>
										<Separator orientation="vertical" />
										<Button
											variant="ghost"
											className="w-full"
											onClick={() =>
												setCurrentPattern({
													...currentPattern,
													groups:
														currentPattern?.groups?.filter(
															(e) => e.name !== s?.name,
														) ?? [],
												})
											}
										>
											<XCircle />
										</Button>
									</div>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>{formatPatternGroup(s)}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					{i < selectableSteps.length - 1 && <p>&#8594;</p>}
				</div>
			))}
			<Button
				className="space-x-2"
				onClick={() => {
					const nextGroupId =
						Math.max(
							0,
							...(currentPattern?.groups
								?.map((e) => {
									try {
										return Number.parseInt(e.name.split("-")[1]);
									} catch (error) {
										return false;
									}
								})
								.filter((n) => n) as number[]),
						) + 1;
					setCurrentPattern({
						...currentPattern,
						groups: [
							...(currentPattern?.groups ?? []),
							PatternGroup.parse({
								name: `Group-${nextGroupId}`,
							} as PatternGroup),
						],
					});
				}}
			>
				<CirclePlus /> Add group
			</Button>
		</div>
	);
};

export default ProfilePatternEditor;
