import type { ChatAddToolApproveResponseFunction } from "ai";
import { CircleCheckIcon, LoaderCircleIcon, TerminalIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeBlock, CodeBlockContent } from "@/components/ui/code-block";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
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

interface StepRowProps {
	projectId: string;
	part: ChatPart;
	streaming: boolean;
	addToolApprovalResponse: ChatAddToolApproveResponseFunction;
}

export function StepRow({
	projectId,
	part,
	streaming,
	addToolApprovalResponse,
}: StepRowProps) {
	if (part.type === "reasoning") {
		return (
			<ReasoningRow text={part.text} running={part.state === "streaming"} />
		);
	}
	if (part.type?.startsWith("tool-")) {
		// @ts-expect-error
		if (part.state === "approval-requested") {
			return (
				<ApprovalRequestRow
					// @ts-expect-error
					part={part}
					addToolApprovalResponse={addToolApprovalResponse}
					projectId={projectId}
				/>
			);
		}
		return (
			<ToolRow
				// @ts-expect-error
				part={part}
				streaming={streaming}
			/>
		);
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

	if (part.state === "output-denied") {
		return (
			<TraceLine>
				<TraceIcon>
					<TerminalIcon />
				</TraceIcon>
				<TraceTitle>Denied {command}</TraceTitle>
			</TraceLine>
		);
	}

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
							{failed ? part.errorText : JSON.stringify(part.output)}
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

type ApprovalRequestPart = Extract<
	ChatPart,
	{ type: "tool-runCommand"; state: "approval-requested" }
>;

function ApprovalRequestRow({
	part,
	addToolApprovalResponse,
	projectId,
}: {
	part: ApprovalRequestPart;
	addToolApprovalResponse: ChatAddToolApproveResponseFunction;
	projectId: string;
}) {
	return (
		<Item key={part.toolCallId} variant="outline" size="sm">
			<ItemMedia variant="icon">
				<TerminalIcon />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>Run {part.type.replace("tool-", "")}?</ItemTitle>
				<ItemDescription>The command runs in this project.</ItemDescription>
			</ItemContent>
			<ItemActions>
				<Button
					size="sm"
					variant="outline"
					onClick={() =>
						addToolApprovalResponse({
							id: part.approval.id,
							approved: false,
							options: {
								body: {
									projectId,
								},
							},
						})
					}
				>
					Deny
				</Button>
				<Button
					size="sm"
					onClick={() =>
						addToolApprovalResponse({
							id: part.approval.id,
							approved: true,
							options: {
								body: {
									projectId,
								},
							},
						})
					}
				>
					Approve
				</Button>
			</ItemActions>
		</Item>
	);
}
