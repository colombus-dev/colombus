import * as React from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
	fileButtonText?: string;
	noFileText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className,
			type,
			fileButtonText = "Choose files",
			noFileText = "No file chosen",
			onChange,
			...props
		},
		ref,
	) => {
		const internalRef = React.useRef<HTMLInputElement>(null);
		const [fileLabel, setFileLabel] = React.useState(noFileText);

		React.useImperativeHandle(
			ref,
			() => internalRef.current as HTMLInputElement,
		);

		React.useEffect(() => {
			if (type === "file") {
				const form = internalRef.current?.closest("form");
				if (form) {
					const handleReset = () => setFileLabel(noFileText);
					form.addEventListener("reset", handleReset);
					return () => form.removeEventListener("reset", handleReset);
				}
			}
		}, [type, noFileText]);

		if (type === "file") {
			const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
				const files = e.target.files;
				if (!files || files.length === 0) {
					setFileLabel(noFileText);
				} else if (files.length === 1) {
					setFileLabel(files[0].name);
				} else {
					setFileLabel(`${files.length} files selected`);
				}
				onChange?.(e);
			};

			return (
				<div
					className={cn(
						"flex items-center gap-2 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring md:text-sm",
						className,
					)}
				>
					<input
						type="file"
						className="sr-only"
						ref={internalRef}
						onChange={handleChange}
						{...props}
					/>
					<button
						type="button"
						className="shrink-0 rounded bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
						onClick={() => internalRef.current?.click()}
					>
						{fileButtonText}
					</button>
					<span className="text-xs text-muted-foreground truncate flex-1 text-left">
						{fileLabel}
					</span>
				</div>
			);
		}

		return (
			<input
				type={type}
				className={cn(
					"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
					className,
				)}
				ref={internalRef}
				onChange={onChange}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
