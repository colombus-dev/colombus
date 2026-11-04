// Compatibility bridge for v4 examples that still import from `@/lib/ai`.
// The public chat API lives in `@shadcn/helpers/ai-sdk`; `getMessageText`
// remains local to the app.
export * from "@shadcn/helpers/ai-sdk";

import type { ChatMessage } from "@/lib/types";

export function getMessageText(message: Pick<ChatMessage, "parts">) {
	return message.parts.reduce(
		(text, part) => (part.type === "text" ? text + part.text : text),
		"",
	);
}

export const DEMO_SUGGESTIONS = [
	"Describe the pattern",
	"Refine the pattern",
	"Execute the pattern",
];
