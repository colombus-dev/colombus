import { useChat } from "@ai-sdk/react";
import {
	ArrowUpIcon,
	MessageCircleDashedIcon,
	RotateCwIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { StepRow } from "@/components/chat/step-row";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "@/components/ui/input-group";
import { Markdown } from "@/components/ui/markdown";
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trace } from "@/components/ui/trace";
import { DEMO_CHAT, getMessageText } from "@/lib/ai";
import { MESSAGE_ANIMATION } from "@/lib/message-animation";
import { cn } from "@/lib/utils";
import { ContextUsageCard } from "./chat/context-usage-card";

const initialMessages = DEMO_CHAT.get(0);
const transport = DEMO_CHAT.transport({
	delayMs: 16,
	fallback:
		"This demo only knows the scripted turns. Press reset to start over.",
});

const MotionMessageScrollerItem = motion.create(MessageScrollerItem);

export function ChatDemo() {
	const { messages, sendMessage, setMessages, status } = useChat({
		messages: initialMessages,
		transport,
	});
	const [draft, setDraft] = React.useState<string | null>(null);
	const formRef = React.useRef<HTMLFormElement>(null);
	const shouldReduceMotion = useReducedMotion();
	const nextMessage = DEMO_CHAT.next(messages);
	const busy = status === "submitted" || status === "streaming";
	const text = draft ?? (nextMessage ? getMessageText(nextMessage) : "");
	const canSend = text.trim().length > 0 && !busy;

	function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canSend) {
			return;
		}

		if (draft === null && nextMessage) {
			void sendMessage(nextMessage);
		} else {
			void sendMessage({ text: text.trim() });
		}
		setDraft(null);
	}

	return (
		<section
			className={cn(
				"flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
			)}
		>
			<MessageScrollerProvider>
				<div className="relative flex h-full w-full flex-col gap-4 [[data-slot=preview]:has(&)]:bg-background [[data-slot=preview]:has(&)>div]:p-0!">
					<div className="flex h-full w-full flex-col gap-4">
						<div className="flex items-start justify-between gap-4 p-8 pb-4">
							<div className="flex flex-col gap-1">
								{/**PereyBot named after Marguerite Perey (https://en.wikipedia.org/wiki/Marguerite_Perey)*/}
								<div className="font-medium">Ask PereyBot</div>
								<div className="text-sm text-muted-foreground">
									An agent for identifying new patterns.
								</div>
							</div>
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											variant="outline"
											size="icon"
											aria-label="Reset conversation"
											onClick={() => {
												setMessages(initialMessages);
												setDraft(null);
											}}
											disabled={busy}
										>
											<RotateCwIcon />
										</Button>
									}
								/>
								<TooltipContent>
									<p>Reset</p>
								</TooltipContent>
							</Tooltip>
						</div>
						<div className="min-h-0 flex-1">
							{messages.length === 0 ? (
								<Empty className="h-full">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<MessageCircleDashedIcon />
										</EmptyMedia>
										<EmptyTitle>What should we build?</EmptyTitle>
										<EmptyDescription>
											The agent can generate, fix, execute patterns and explore
											profiles.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							) : (
								<MessageScroller>
									<MessageScrollerViewport>
										<MessageScrollerContent
											aria-busy={busy}
											className="gap-6 px-8 py-0"
										>
											{messages.map((message) => {
												if (message.role === "user") {
													return (
														<MotionMessageScrollerItem
															key={message.id}
															messageId={message.id}
															scrollAnchor
															variants={MESSAGE_ANIMATION.variants}
															initial={shouldReduceMotion ? false : "initial"}
															animate="animate"
														>
															<Message align="end">
																<MessageContent>
																	<Bubble align="end" variant="muted">
																		<BubbleContent>
																			{getMessageText(message)}
																		</BubbleContent>
																	</Bubble>
																</MessageContent>
															</Message>
														</MotionMessageScrollerItem>
													);
												}

												const streaming = busy && message === messages.at(-1);
												const steps = message.parts.filter(
													(part) =>
														part.type === "reasoning" ||
														part.type === "tool-runCommand",
												);
												const reply = getMessageText(message);

												return (
													<MessageScrollerItem
														key={message.id}
														messageId={message.id}
													>
														<Message>
															<MessageContent className="gap-3">
																{steps.length > 0 && (
																	<Trace>
																		{steps.map((part, index) => (
																			<StepRow
																				// biome-ignore lint/suspicious/noArrayIndexKey: TODO
																				key={index}
																				part={part}
																				streaming={streaming}
																			/>
																		))}
																	</Trace>
																)}
																{reply && <Markdown>{reply}</Markdown>}
															</MessageContent>
														</Message>
													</MessageScrollerItem>
												);
											})}
										</MessageScrollerContent>
									</MessageScrollerViewport>
									<MessageScrollerButton />
								</MessageScroller>
							)}
						</div>
						<div>
							<form ref={formRef} onSubmit={onSubmit} className="w-full">
								<InputGroup>
									<InputGroupTextarea
										value={text}
										onChange={(event) => setDraft(event.target.value)}
										placeholder="Ask the agent..."
										aria-label="Message"
										className="min-h-14"
										onKeyDown={(event) => {
											if (event.key === "Enter" && !event.shiftKey) {
												event.preventDefault();
												formRef.current?.requestSubmit();
											}
										}}
									/>
									<InputGroupAddon align="block-end" className="pt-1">
										{/** TODO: pass usage to card component inputTokens={messages[messages.length - 1]?.metadata?.usage?.inputTokens} */}
										<ContextUsageCard />
										<InputGroupButton
											type="submit"
											variant="default"
											size="icon-sm"
											disabled={!canSend}
											className="ml-auto"
										>
											<ArrowUpIcon />
											<span className="sr-only">Send</span>
										</InputGroupButton>
									</InputGroupAddon>
								</InputGroup>
							</form>
						</div>
					</div>
				</div>
			</MessageScrollerProvider>
		</section>
	);
}
