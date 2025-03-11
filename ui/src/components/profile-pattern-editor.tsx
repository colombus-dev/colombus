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
import ProfilePatternGroupMetaInstructionModal from "./profile-pattern-group-metainstruction-modal";

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
				<div key={s?.name ?? "select"} className="grid grid-rows-2">
					<div className="flex row-span-1">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
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
					<div className="row-span-1 flex">
						{s.metaInstructions?.map((mi, j) => (
							<div key={`step-${s.name}_MetaInstruction-${j}`}>
								<div className="border">
									<div>
										<p className="text-center">{`MetaInstruction-${j}`}</p>
									</div>
									<Separator />
									<div className="flex items-center">
										<ProfilePatternGroupMetaInstructionModal
											value={mi}
											onValueChange={(pe) => {
												setCurrentPattern({
													...currentPattern,
													groups:
														currentPattern?.groups?.map((e) => ({
															...e,
															metaInstructions: e.metaInstructions?.map(
																(_mi, mi_i) => (mi_i === j ? pe : _mi),
															),
														})) ?? [],
												});
											}}
										>
											<Button variant="ghost" className="w-full">
												<Pencil />
											</Button>
										</ProfilePatternGroupMetaInstructionModal>
										<Separator orientation="vertical" />
										<Button
											variant="ghost"
											className="w-full"
											onClick={() => {
												setCurrentPattern({
													...currentPattern,
													groups:
														currentPattern?.groups?.map((e) => ({
															...e,
															metaInstructions: e.metaInstructions?.filter(
																(_, mi_i) => mi_i !== j,
															),
														})) ?? [],
												});
											}}
										>
											<XCircle />
										</Button>
									</div>
								</div>
								{j < (s.metaInstructions ?? []).length - 1 && <p>&#8594;</p>}
							</div>
						))}
						<Button
							className="space-x-2"
							onClick={() => {
								setCurrentPattern({
									...currentPattern,
									groups: currentPattern?.groups?.map((g, gi) =>
										gi === i
											? {
													...g,
													metaInstructions: [...(g.metaInstructions ?? []), {}],
												}
											: g,
									),
								});
							}}
						>
							<CirclePlus /> Add metainstruction
						</Button>
					</div>
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
