import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	specialCharacterNOT,
	specialCharacterOR,
	specialSteps,
	stepsColorsMapping,
	supportedSteps,
} from "@/configuration";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PatternElement } from "@/lib/types";

const ProfilePatternEditor: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const currentPattern = useColombusStore((state) => state.currentPattern);
	const setCurrentPattern = useColombusStore(
		(state) => state.setCurrentPattern,
	);
	const availablePatterns = useColombusStore((state) => state.allSavedPatterns);
	const selectableSteps = !currentPattern?.elements?.length
		? [undefined]
		: [...currentPattern.elements, undefined];
	// TODO: currently only supporting first pattern layer

	const formatPatternElement = (pe: PatternElement) => {
		// TODO: to clean/improve
		let preprocessedName = pe.name
			.split(specialCharacterOR)
			.join(" OR ")
			.replace(specialCharacterNOT, "");
		if (pe.type === "subpattern") {
			preprocessedName = `Pattern[${preprocessedName}]`;
		}
		if (pe.name.startsWith(specialCharacterNOT)) {
			preprocessedName = `NOT (${preprocessedName})`;
		}
		return preprocessedName;
	};

	return (
		<div {...divProps} className={cn("flex", divProps.className)}>
			{currentPattern?.name && (
				<p className="pt-2 px-2 font-bold">{currentPattern.name}: </p>
			)}
			{selectableSteps.map((p, i) => (
				<div key={`${i}_${p}`} className="flex items-stretch">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								<tr key={`legend_color_${p}`}>
									<td
										style={{
											backgroundColor: Object.entries(stepsColorsMapping).find(
												(o) => o[0] === p?.name,
											)?.[1],
											width: "20px",
											height: "20px",
										}}
									/>
									<td>{p ? formatPatternElement(p) : "Select step..."}</td>
								</tr>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>Steps</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<ScrollArea className="col-span-2 h-60">
								{supportedSteps.map((s) => (
									<DropdownMenuCheckboxItem
										key={s}
										onCheckedChange={(isChecked) => {
											const newSteps = [...(currentPattern?.elements ?? [])];
											if (isChecked) {
												newSteps[i] = {
													name:
														p && supportedSteps.includes(p.name)
															? `${p.name}${specialCharacterOR}${s}`
															: s,
													tasks: [],
													type: "simple",
												};
											} else {
												const stepsToKeep = (
													newSteps[i] as { name: string }
												).name
													.split(specialCharacterOR)
													.filter((spl) => spl !== s);
												if (stepsToKeep.length === 0) {
													newSteps.splice(i, 1);
												} else {
													newSteps[i] = {
														name: stepsToKeep.join(specialCharacterOR),
														tasks: [],
														type: "simple",
													};
												}
											}
											setCurrentPattern({
												...currentPattern,
												elements: newSteps,
											});
										}}
										checked={
											currentPattern &&
											i < currentPattern.elements.length &&
											currentPattern.elements[i].name
												.split(specialCharacterOR)
												.includes(s)
										}
									>
										{s}
									</DropdownMenuCheckboxItem>
								))}
							</ScrollArea>
							<DropdownMenuLabel>Saved Patterns</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{availablePatterns.map(({ name, elements: tasks }) => (
								<DropdownMenuCheckboxItem
									key={name}
									onCheckedChange={(isChecked) => {
										if (!name) {
											return;
										}
										const newSteps = [...(currentPattern?.elements ?? [])];
										if (isChecked) {
											newSteps[i] = { name, tasks, type: "subpattern" };
										} else {
											newSteps.splice(i, 1);
										}
										setCurrentPattern({
											...currentPattern,
											elements: newSteps,
										});
									}}
									checked={
										name !== undefined &&
										currentPattern &&
										i < currentPattern.elements.length &&
										currentPattern?.elements[i].name
											.split(specialCharacterOR)
											.includes(name)
									}
									// disabling current pattern to avoid recursion in ppm
									disabled={name === currentPattern?.name}
								>
									{name}
								</DropdownMenuCheckboxItem>
							))}
							<DropdownMenuLabel>Pattern elements</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{specialSteps.map((s) => (
								<DropdownMenuCheckboxItem
									key={s}
									onCheckedChange={(isChecked) => {
										const newSteps = [...(currentPattern?.elements ?? [])];
										if (isChecked) {
											newSteps[i] = { name: s, tasks: [], type: "special" };
										} else {
											newSteps.splice(i, 1);
										}
										setCurrentPattern({
											...currentPattern,
											elements: newSteps,
										});
									}}
									checked={
										typeof currentPattern?.elements[i] === "string" &&
										currentPattern.elements[i] === s
									}
								>
									{s}
								</DropdownMenuCheckboxItem>
							))}
							<DropdownMenuCheckboxItem
								key="negate"
								onCheckedChange={(isChecked) => {
									if (!p) {
										return;
									}
									const newSteps = [...(currentPattern?.elements ?? [])];
									if (isChecked) {
										newSteps[i] = {
											...p,
											name: `${specialCharacterNOT}${p.name}`,
										};
									} else {
										newSteps[i] = {
											...p,
											name: p.name.replace(specialCharacterNOT, ""),
										};
									}
									setCurrentPattern({
										...currentPattern,
										elements: newSteps,
									});
								}}
								checked={p?.name.startsWith(specialCharacterNOT)}
								disabled={!p || specialSteps.includes(p.name)}
							>
								Negate (<p className="font-bold">NOT</p>)
							</DropdownMenuCheckboxItem>
							<DropdownMenuLabel>Other actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{p && (
								<DropdownMenuItem
									onClick={() => {
										const newSteps = [...(currentPattern?.elements ?? [])];
										newSteps.splice(i, 1);
										setCurrentPattern({
											...currentPattern,
											elements: newSteps,
										});
									}}
									disabled={p === undefined}
									asChild
								>
									<Button variant="ghost" className="w-full">
										<XCircle /> Remove
									</Button>
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
					{i < selectableSteps.length - 1 && <p>&#8594;</p>}
				</div>
			))}
		</div>
	);
};

export default ProfilePatternEditor;
