import { CircleCheckIcon, LoaderCircleIcon, TerminalIcon } from "lucide-react";
import { useState } from "react";
import { CodeBlock, CodeBlockContent } from "@/components/ui/code-block";
import {
	TraceCollapsible,
	TraceCollapsibleContent,
	TraceCollapsibleTrigger,
	TraceIcon,
	TraceLine,
	TraceTitle,
} from "@/components/ui/trace";
import type { ChatMessage } from "@/lib/types";

type ChatPart = ChatMessage["parts"][number];

export function StepRow({
	part,
	streaming,
}: {
	part: ChatPart;
	streaming: boolean;
}) {
	if (part.type === "reasoning") {
		return (
			<ReasoningRow text={part.text} running={part.state === "streaming"} />
		);
	}

	if (part.type === "tool-runCommand") {
		return <ToolRow part={part} streaming={streaming} />;
	}

	return null;
}

function ReasoningRow({ text, running }: { text: string; running: boolean }) {
	const [open, setOpen] = useState<boolean>();

	return (
		<TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
			<TraceCollapsibleTrigger>
				<TraceLine status={running ? "running" : undefined}>
					<TraceIcon>
						{running ? (
							<LoaderCircleIcon className="animate-spin" />
						) : (
							<CircleCheckIcon />
						)}
					</TraceIcon>
					<TraceTitle>{running ? "Thinking" : "Thought"}</TraceTitle>
				</TraceLine>
			</TraceCollapsibleTrigger>
			<TraceCollapsibleContent className="whitespace-pre-wrap">
				{text}
			</TraceCollapsibleContent>
		</TraceCollapsible>
	);
}

type ToolPart = Extract<ChatPart, { type: "tool-runCommand" }>;

function ToolRow({ part, streaming }: { part: ToolPart; streaming: boolean }) {
	const command = part.input?.command;

	if (part.state === "output-available" || part.state === "output-error") {
		const failed = part.state === "output-error";

		return (
			<TraceCollapsible>
				<TraceCollapsibleTrigger>
					<TraceLine status={failed ? "error" : undefined}>
						<TraceIcon>
							<TerminalIcon />
						</TraceIcon>
						<TraceTitle>
							{failed ? "Failed to run" : "Ran"} {command}
						</TraceTitle>
					</TraceLine>
				</TraceCollapsibleTrigger>
				<TraceCollapsibleContent>
					<CodeBlock size="sm">
						<CodeBlockContent wrap className="max-h-64">
							{failed ? part.errorText : part.output.stdout}
						</CodeBlockContent>
					</CodeBlock>
				</TraceCollapsibleContent>
			</TraceCollapsible>
		);
	}

	return (
		<TraceLine status={streaming ? "running" : "error"}>
			<TraceIcon>
				<TerminalIcon />
			</TraceIcon>
			<TraceTitle>
				{streaming ? "Running" : "Failed to run"} {command}
			</TraceTitle>
		</TraceLine>
	);
}
