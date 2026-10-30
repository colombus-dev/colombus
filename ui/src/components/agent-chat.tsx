// AgentChat.tsx

import { useChat } from "@ai-sdk/react";
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { TerminalIcon } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { CodeBlock, CodeBlockContent } from "@/components/ui/code-block";
import {
	InputGroup,
	InputGroupButton,
	InputGroupTextarea,
} from "@/components/ui/input-group";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Message, MessageContent } from "@/components/ui/message";
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import {
	Trace,
	TraceCollapsible,
	TraceCollapsibleContent,
	TraceCollapsibleTrigger,
	TraceIcon,
	TraceLine,
	TraceTitle,
} from "@/components/ui/trace";
import { cn } from "@/lib/utils";

function ToolLine({ part, streaming }: { part: any; streaming: boolean }) {
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

export function AgentChat() {
	const { projectId } = useParams<{ projectId: string }>();
	const { messages, sendMessage, status, addToolApprovalResponse } = useChat({
		// @ts-expect-error
		api: `${import.meta.env.BASE_URL}chat`,
		sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
	});
	const [input, setInput] = useState("");
	const streaming = status === "streaming";

	const handleSend = () => {
		if (!input.trim()) return;
		sendMessage({ text: input }, { body: { projectId: projectId } });
		setInput("");
	};

	return (
		<section
			className={cn(
				"flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
			)}
		>
			<MessageScrollerProvider autoScroll>
				<MessageScroller>
					<MessageScrollerViewport>
						<MessageScrollerContent>
							{messages.map((m) => (
								<MessageScrollerItem
									key={m.id}
									messageId={m.id}
									scrollAnchor={m.role === "user"}
								>
									<Message align={m.role === "user" ? "end" : "start"}>
										<MessageContent>
											{m.parts.map((part: any, i: number) => {
												if (part.type === "text") {
													return (
														<Bubble
															// biome-ignore lint/suspicious/noArrayIndexKey: TODO
															key={i}
															align={m.role === "user" ? "end" : "start"}
															variant="muted"
														>
															<BubbleContent>{part.text}</BubbleContent>
														</Bubble>
													);
												}

												if (
													part.type?.startsWith("tool-") &&
													part.state === "approval-requested"
												) {
													return (
														// biome-ignore lint/suspicious/noArrayIndexKey: TODO
														<Item key={i} variant="outline" size="sm">
															<ItemMedia variant="icon">
																<TerminalIcon />
															</ItemMedia>
															<ItemContent>
																<ItemTitle>
																	Run {part.type.replace("tool-", "")}?
																</ItemTitle>
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

												if (part.type?.startsWith("tool-")) {
													return (
														// biome-ignore lint/suspicious/noArrayIndexKey: TODO
														<Trace key={i}>
															<ToolLine part={part} streaming={streaming} />
														</Trace>
													);
												}

												return null;
											})}
										</MessageContent>
									</Message>
								</MessageScrollerItem>
							))}
						</MessageScrollerContent>
					</MessageScrollerViewport>
					<MessageScrollerButton />
				</MessageScroller>
			</MessageScrollerProvider>

			<InputGroup>
				<InputGroupTextarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSend();
						}
					}}
					placeholder="Ask agent..."
					disabled={streaming}
				/>
				<InputGroupButton onClick={handleSend} disabled={streaming}>
					Send
				</InputGroupButton>
			</InputGroup>
		</section>
	);
}
