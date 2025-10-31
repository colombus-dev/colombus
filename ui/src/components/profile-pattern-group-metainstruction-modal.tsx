import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { PatternGroupMetaInstruction } from "@/lib/types";

interface ProfilePatternGroupMetaInstructionModalProps {
	value: PatternGroupMetaInstruction;
	onValueChange: (pe: PatternGroupMetaInstruction) => void;
}

export default function ProfilePatternGroupMetaInstructionModal({
	value,
	onValueChange,
	children,
}: React.PropsWithChildren<ProfilePatternGroupMetaInstructionModalProps>) {
	const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
	const form = useForm<z.infer<typeof PatternGroupMetaInstruction>>({
		resolver: zodResolver(PatternGroupMetaInstruction),
		values: {
			// TODO: replace ?? undefined once typing fixed
			algoFamily: value.algoFamily ?? undefined,
			algoName: value.algoName ?? undefined,
			library: value.library ?? undefined,
			function: value.function ?? undefined,
		},
	});

	const onFormSubmit = useCallback(
		(pgmi: PatternGroupMetaInstruction) => {
			onValueChange(pgmi);
			setIsDialogOpen(false);
		},
		[onValueChange],
	);

	const onOpenChange = useCallback(
		(open: boolean) => {
			form.reset({
				// TODO: replace ?? undefined once typing fixed
				algoFamily: value.algoFamily ?? undefined,
				algoName: value.algoName ?? undefined,
				library: value.library ?? undefined,
				function: value.function ?? undefined,
			});
			setIsDialogOpen(open);
		},
		[form, value],
	);

	return (
		<Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="min-w-fit">
				<DialogHeader>
					<DialogTitle>
						Edit the meta-instruction pattern matching group
					</DialogTitle>
					<DialogDescription>TODO</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onFormSubmit)}
						className="space-y-6 max-w-7xl"
					>
						<FormField
							control={form.control}
							name="algoFamily"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Algorithm Family</FormLabel>
									<FormControl>
										<Input
											placeholder="algorithm family"
											value={field.value}
											onChange={field.onChange}
										/>
									</FormControl>
									<FormDescription>TODO</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="algoName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Algorithm Name</FormLabel>
									<FormControl>
										<Input
											placeholder="algorithm name"
											value={field.value}
											onChange={field.onChange}
										/>
									</FormControl>
									<FormDescription>TODO</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="library"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Library Name</FormLabel>
									<FormControl>
										<Input
											placeholder="library name"
											value={field.value}
											onChange={field.onChange}
										/>
									</FormControl>
									<FormDescription>TODO</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="function"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Function Name</FormLabel>
									<FormControl>
										<Input
											placeholder="function name"
											value={field.value}
											onChange={field.onChange}
										/>
									</FormControl>
									<FormDescription>TODO</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit">Save</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
