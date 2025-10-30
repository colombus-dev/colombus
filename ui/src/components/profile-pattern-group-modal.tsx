import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	metacharacterENDS,
	metacharacterNOT,
	metacharacterPLUS,
	metacharacterSTAR,
	metacharacterSTARTS,
	supportedSteps,
} from "@/configuration";
import { PatternGroup } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

interface ProfilePatternGroupModalProps {
	value: PatternGroup;
	onValueChange: (pe: PatternGroup) => void;
}

export default function ProfilePatternGroupModal({
	value,
	onValueChange,
	children,
}: React.PropsWithChildren<ProfilePatternGroupModalProps>) {
	const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
	const availablePatterns = useColombusStore((state) => state.allSavedPatterns);

	const form = useForm<z.infer<typeof PatternGroup>>({
		resolver: zodResolver(PatternGroup),
		values: value,
	});

	const onFormSubmit = useCallback(
		(pe: PatternGroup) => {
			onValueChange(pe);
			setIsDialogOpen(false);
		},
		[onValueChange],
	);

	const onOpenChange = useCallback(
		(open: boolean) => {
			form.reset({ ...value });
			setIsDialogOpen(open);
		},
		[form, value],
	);

	return (
		<Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="min-w-fit">
				<DialogHeader>
					<DialogTitle>Edit the pattern matching group</DialogTitle>
					<DialogDescription>TODO</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onFormSubmit)}
						className="space-y-6 max-w-7xl"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input
											placeholder="group name"
											value={field.value}
											onChange={field.onChange}
										/>
									</FormControl>
									<FormDescription>TODO</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2">
							<FormField
								control={form.control}
								name="steps"
								render={({ field }) => (
									<FormItem className="flex flex-col">
										<FormLabel>Steps</FormLabel>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl className="text-ellipsis">
													<Button
														variant="outline"
														// biome-ignore lint/a11y/useSemanticElements: <explanation>
														role="combobox"
														className={cn(
															"justify-between",
															!field.value?.length && "text-muted-foreground",
														)}
													>
														{field.value?.length
															? supportedSteps
																	.filter((step) => field.value?.includes(step))
																	.join(", ")
															: "Select step"}
														<ChevronsUpDown className="opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="p-0">
												<Command>
													<CommandInput
														placeholder="Search step..."
														className="h-9"
													/>
													<CommandList>
														<CommandEmpty>No step found.</CommandEmpty>
														<CommandGroup>
															{supportedSteps.map((step) => (
																<CommandItem
																	value={step}
																	key={step}
																	onSelect={(v) => {
																		if (!field.value) {
																			// should not happen
																			// TODO: need to fix PatternElement zod definition
																			return;
																		}
																		const selectedStepIndex =
																			field.value.indexOf(step);
																		if (selectedStepIndex !== -1) {
																			field.value.splice(selectedStepIndex, 1);
																		} else {
																			field.value.push(v);
																		}
																		form.setValue("steps", [...field.value]);
																	}}
																>
																	{step}
																	<Check
																		className={cn(
																			"ml-auto",
																			field.value?.includes(step)
																				? "opacity-100"
																				: "opacity-0",
																		)}
																	/>
																</CommandItem>
															))}
														</CommandGroup>
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>
										<FormDescription>TODO.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="subpattern"
								render={({ field }) => (
									<FormItem className="flex flex-col">
										<FormLabel>Patterns</FormLabel>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl className="text-ellipsis">
													<Button
														variant="outline"
														// biome-ignore lint/a11y/useSemanticElements: <explanation>
														role="combobox"
														className={cn(
															"justify-between",
															!field.value && "text-muted-foreground",
														)}
													>
														{field.value
															? availablePatterns
																	.filter(
																		(p) =>
																			p.name && field.value?.name === p.name,
																	)
																	.map(({ name }) => name)
																	.join(", ")
															: "Select subpattern"}
														<ChevronsUpDown className="opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="p-0">
												<Command>
													<CommandInput
														placeholder="Search subpattern..."
														className="h-9"
													/>
													<CommandList>
														<CommandEmpty>No pattern found.</CommandEmpty>
														<CommandGroup>
															{availablePatterns.map((p) => (
																<CommandItem
																	value={p.name}
																	key={p.name}
																	onSelect={() => {
																		form.setValue("subpattern", { ...p });
																	}}
																>
																	{p.name}
																	<Check
																		className={cn(
																			"ml-auto",
																			p.name && field.value?.name === p.name
																				? "opacity-100"
																				: "opacity-0",
																		)}
																	/>
																</CommandItem>
															))}
														</CommandGroup>
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>
										<FormDescription>TODO.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-2">
							<FormField
								control={form.control}
								name="multiplicity"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<div className="mb-4">
											<FormLabel className="text-base">Multiplicity</FormLabel>
											<FormDescription>TODO</FormDescription>
										</div>
										<FormControl>
											<RadioGroup
												onValueChange={field.onChange}
												defaultValue={field.value}
												className="flex flex-col space-y-1"
											>
												<FormItem className="flex items-center space-x-3 space-y-0">
													<FormControl>
														<RadioGroupItem value={"1"} />
													</FormControl>
													<FormLabel className="font-normal">One</FormLabel>
												</FormItem>
												<FormItem className="flex items-center space-x-3 space-y-0">
													<FormControl>
														<RadioGroupItem value={metacharacterPLUS} />
													</FormControl>
													<FormLabel className="font-normal">
														One or More Consecutive
													</FormLabel>
												</FormItem>
												<FormItem className="flex items-center space-x-3 space-y-0">
													<FormControl>
														<RadioGroupItem value={metacharacterSTAR} />
													</FormControl>
													<FormLabel className="font-normal">
														Zero or More Consecutive
													</FormLabel>
												</FormItem>
											</RadioGroup>
										</FormControl>
										<FormDescription>TODO.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="metaCharacters"
								render={() => (
									<FormItem className="col-span-1">
										<div className="mb-4">
											<FormLabel className="text-base">
												Metacharacters
											</FormLabel>
											<FormDescription>TODO</FormDescription>
										</div>
										<FormField
											key={metacharacterSTARTS}
											control={form.control}
											name="metaCharacters.startsWith"
											render={({ field }) => {
												return (
													<FormItem
														key={metacharacterSTARTS}
														className="flex flex-row items-start space-x-3 space-y-0"
													>
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
														<FormLabel className="text-sm font-normal">
															Starts with (<b>{metacharacterSTARTS}</b>)
														</FormLabel>
													</FormItem>
												);
											}}
										/>
										<FormField
											key={metacharacterENDS}
											control={form.control}
											name="metaCharacters.endsWith"
											render={({ field }) => {
												return (
													<FormItem
														key={metacharacterENDS}
														className="flex flex-row items-start space-x-3 space-y-0"
													>
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
														<FormLabel className="text-sm font-normal">
															Ends with (<b>{metacharacterENDS}</b>)
														</FormLabel>
													</FormItem>
												);
											}}
										/>
										<FormField
											key={metacharacterNOT}
											control={form.control}
											name="metaCharacters.negate"
											render={({ field }) => {
												return (
													<FormItem
														key={metacharacterNOT}
														className="flex flex-row items-start space-x-3 space-y-0"
													>
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
														<FormLabel className="text-sm font-normal">
															Not (<b>{metacharacterNOT}</b>)
														</FormLabel>
													</FormItem>
												);
											}}
										/>
										<FormDescription>TODO.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<Button type="submit">Save</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
