import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	specialCharacterENDS,
	specialCharacterNOT,
	specialCharacterOR,
	specialCharacterPLUS,
	specialCharacterSTAR,
	specialCharacterSTARTS,
	stepsColorsMapping,
	supportedSteps,
} from "@/configuration";
import { cn, formatPatternElement } from "@/lib/utils";
import { useColombusStore } from "@/store";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { XCircle } from "lucide-react";

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
							<ScrollArea className="col-span-2 h-48">
								{supportedSteps.map((s) => (
									<DropdownMenuCheckboxItem
										key={s}
										onCheckedChange={(isChecked) => {
											const newSteps = [...(currentPattern?.elements ?? [])];
											const nameWithoutGroupSymbols = p?.name
												.replace(specialCharacterSTAR, "")
												.replace(specialCharacterPLUS, "");
											const group =
												p?.name.endsWith(specialCharacterSTAR) ||
												p?.name.endsWith(specialCharacterPLUS)
													? p.name.at(-1)
													: "";
											if (isChecked) {
												newSteps[i] = {
													name: nameWithoutGroupSymbols
														?.replace(specialCharacterNOT, "")
														.split(specialCharacterOR)
														.filter((n) => supportedSteps.includes(n)).length
														? `${nameWithoutGroupSymbols}${specialCharacterOR}${s}${group}`
														: s,
													tasks: [],
													type: "simple",
												};
											} else {
												const stepsToKeep = newSteps[i].name
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
												.replace(specialCharacterNOT, "")
												.replace(specialCharacterSTAR, "")
												.replace(specialCharacterPLUS, "")
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
							<DropdownMenuLabel>Pattern Matching elements</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuCheckboxItem
								key="starts-with"
								onCheckedChange={(isChecked) => {
									if (!p) {
										return;
									}
									const newSteps = [...(currentPattern?.elements ?? [])];
									if (isChecked) {
										newSteps[i] = {
											...p,
											name: `${specialCharacterSTARTS}${p.name}`,
										};
									} else {
										newSteps[i] = {
											...p,
											name: p.name.replace(specialCharacterSTARTS, ""),
										};
									}
									setCurrentPattern({
										...currentPattern,
										elements: newSteps,
									});
								}}
								checked={p?.name.startsWith(specialCharacterSTARTS)}
								disabled={!p}
							>
								Starts with (<p className="font-bold">^</p>)
							</DropdownMenuCheckboxItem>
							<DropdownMenuCheckboxItem
								key="ends-with"
								onCheckedChange={(isChecked) => {
									if (!p) {
										return;
									}
									const newSteps = [...(currentPattern?.elements ?? [])];
									if (isChecked) {
										newSteps[i] = {
											...p,
											name: `${p.name}${specialCharacterENDS}`,
										};
									} else {
										newSteps[i] = {
											...p,
											name: p.name.replace(specialCharacterENDS, ""),
										};
									}
									setCurrentPattern({
										...currentPattern,
										elements: newSteps,
									});
								}}
								checked={p?.name.endsWith(specialCharacterENDS)}
								disabled={!p}
							>
								Ends with (<p className="font-bold">$</p>)
							</DropdownMenuCheckboxItem>
							<DropdownMenuCheckboxItem
								key="negate"
								onCheckedChange={(isChecked) => {
									if (!p) {
										return;
									}
									const newSteps = [...(currentPattern?.elements ?? [])];
									if (isChecked) {
										const prefix = p.name.startsWith(specialCharacterSTARTS)
											? specialCharacterSTARTS
											: "";
										newSteps[i] = {
											...p,
											name: `${prefix}${specialCharacterNOT}${p.name.replace(specialCharacterSTARTS, "")}`,
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
								checked={p?.name.replace(specialCharacterSTAR, "").startsWith(specialCharacterNOT)}
								disabled={!p}
							>
								Not (<p className="font-bold">!</p>)
							</DropdownMenuCheckboxItem>
							<DropdownMenuCheckboxItem
								key="star"
								onCheckedChange={(isChecked) => {
									const currentPatternElement = p ?? {
										name: "",
										tasks: [],
										type: "simple",
									};
									const newSteps = [...(currentPattern?.elements ?? [])];
									if (isChecked) {
										const suffix = currentPatternElement.name.startsWith(specialCharacterENDS)
											? specialCharacterENDS
											: "";
										newSteps[i] = {
											...currentPatternElement,
											name: `${currentPatternElement.name.replace(specialCharacterPLUS, "").replace(specialCharacterENDS, "")}${specialCharacterSTAR}${suffix}`,
										};
									} else {
										const newPatternElementName = currentPatternElement.name.replace(
											specialCharacterSTAR,
											"",
										);
										if (newPatternElementName !== "") {
											newSteps[i] = {
												...currentPatternElement,
												name: currentPatternElement.name.replace(specialCharacterSTAR, ""),
											};
										} else {
											newSteps.splice(i, 1);
										}
									}
									setCurrentPattern({
										...currentPattern,
										elements: newSteps,
									});
								}}
								checked={p?.name.replace(specialCharacterENDS, "").endsWith(specialCharacterSTAR)}
							>
								Zero or more (<p className="font-bold">*</p>)
							</DropdownMenuCheckboxItem>
							<DropdownMenuCheckboxItem
								key="plus"
								onCheckedChange={(isChecked) => {
									if (!p) {
										return;
									}
									const newSteps = [...(currentPattern?.elements ?? [])];
									if (isChecked) {
										const suffix = p.name.startsWith(specialCharacterENDS)
											? specialCharacterENDS
											: "";
										newSteps[i] = {
											...p,
											name: `${p.name.replace(specialCharacterSTAR, "").replace(specialCharacterENDS, "")}${specialCharacterPLUS}${suffix}`,
										};
									} else {
										newSteps[i] = {
											...p,
											name: p.name.replace(specialCharacterPLUS, ""),
										};
									}
									setCurrentPattern({
										...currentPattern,
										elements: newSteps,
									});
								}}
								checked={p?.name.replace(specialCharacterENDS, "").endsWith(specialCharacterPLUS)}
								disabled={!p}
							>
								One or more (<p className="font-bold">+</p>)
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
