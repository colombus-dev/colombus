import { Button } from "@/components/ui/button";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";

function formatTokens(value: number) {
	if (value < 1000) {
		return String(value);
	}
	return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
}

interface ContextUsageCardProps {
	inputTokens?: number;
	outputTokens?: number;
	outputReasoningTokens?: number;
	limit?: number;
}

export function ContextUsageCard({
	inputTokens = 0,
	outputTokens = 0,
	outputReasoningTokens = 0,
	limit = 1024,
}: ContextUsageCardProps) {
	const rows = [
		{ label: "Input", value: inputTokens },
		{ label: "Output", value: outputTokens },
		{ label: "Reasoning", value: outputReasoningTokens },
	];
	const used = inputTokens + outputTokens + outputReasoningTokens;
	const percent = Math.round((used / limit) * 100);

	return (
		<div className="flex justify-center">
			<HoverCard>
				<HoverCardTrigger
					delay={10}
					closeDelay={100}
					render={
						<Button variant="outline" size="sm">
							{percent}% context
						</Button>
					}
				/>
				<HoverCardContent className="flex w-64 flex-col gap-3">
					<div className="flex items-center justify-between gap-3 text-sm">
						<span className="font-medium">Context</span>
						<span className="text-muted-foreground">
							{formatTokens(used)} / {formatTokens(limit)}
						</span>
					</div>
					<Progress value={percent} aria-label="Context used" />
					<div className="flex flex-col gap-1 text-sm">
						{rows.map((row) => (
							<div key={row.label} className="flex justify-between gap-3">
								<span className="text-muted-foreground">{row.label}</span>
								<span>{formatTokens(row.value)}</span>
							</div>
						))}
					</div>
				</HoverCardContent>
			</HoverCard>
		</div>
	);
}
