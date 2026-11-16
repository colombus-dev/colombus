import { cn } from "@/lib/utils";

interface SectionHeadingProps {
	title: React.ReactNode;
	description?: React.ReactNode;
	actions?: React.ReactNode;
	className?: string;
}

export const SectionHeading = ({
	title,
	description,
	actions,
	className,
}: SectionHeadingProps) => (
	<div className={cn("flex items-start justify-between gap-2", className)}>
		<div className="min-w-0">
			<h3 className="truncate text-sm font-semibold text-foreground">
				{title}
			</h3>
			{description !== undefined && (
				<p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
			)}
		</div>
		{actions}
	</div>
);
