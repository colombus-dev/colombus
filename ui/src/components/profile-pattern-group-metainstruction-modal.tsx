import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PatternGroupMetaInstruction } from "@/lib/types";
import type { z } from "zod";
import { useCallback, useState } from "react";

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
		values: value,
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
