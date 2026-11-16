import { useId, useRef, useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProjectNameDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	submitLabel: string;
	pendingLabel: string;
	defaultName?: string;
	onSubmit: (name: string) => Promise<void>;
	trigger?: React.ReactNode;
}

const NAME_REQUIRED_MESSAGE = "Project name is required.";

export const ProjectNameDialog = ({
	open,
	onOpenChange,
	title,
	description,
	submitLabel,
	pendingLabel,
	defaultName = "",
	onSubmit,
	trigger,
}: ProjectNameDialogProps) => {
	const [isPending, setIsPending] = useState(false);
	const [nameError, setNameError] = useState<string | null>(null);
	const nameInputRef = useRef<HTMLInputElement>(null);
	const inputId = useId();
	const errorId = useId();

	const handleOpenChange = (nextOpen: boolean) => {
		if (isPending) {
			return;
		}
		onOpenChange(nextOpen);
		if (!nextOpen) {
			setNameError(null);
		}
	};

	const showNameError = (message: string) => {
		setNameError(message);
		nameInputRef.current?.focus();
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const name = (nameInputRef.current?.value ?? "").trim();
		if (name === "") {
			showNameError(NAME_REQUIRED_MESSAGE);
			return;
		}

		setIsPending(true);
		try {
			await onSubmit(name);
			setNameError(null);
			onOpenChange(false);
		} catch (err) {
			showNameError(getApiErrorMessage(err, "Something went wrong."));
		} finally {
			setIsPending(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			{trigger}
			<DialogContent>
				<form noValidate onSubmit={handleSubmit} className="grid gap-6">
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
					</DialogHeader>
					<div className="grid gap-1.5">
						<Label htmlFor={inputId}>Name</Label>
						<Input
							ref={nameInputRef}
							id={inputId}
							required
							autoFocus
							autoComplete="off"
							defaultValue={defaultName}
							placeholder="e.g. Titanic notebooks"
							aria-invalid={nameError !== null}
							aria-describedby={errorId}
							onChange={() => {
								if (nameError !== null) {
									setNameError(null);
								}
							}}
						/>
						<p
							id={errorId}
							role="alert"
							className="min-h-5 text-sm text-destructive"
						>
							{nameError}
						</p>
					</div>
					<DialogFooter>
						<DialogClose
							disabled={isPending}
							render={<Button variant="outline" type="button" />}
						>
							Cancel
						</DialogClose>
						<Button type="submit" disabled={isPending}>
							{isPending ? pendingLabel : submitLabel}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
