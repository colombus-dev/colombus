// Compatibility bridge for v4 examples that still import from `@/lib/ai`.
// The public chat API lives in `@shadcn/helpers/ai-sdk`; `getMessageText`
// remains local to the app.

import { createChat } from "@shadcn/helpers/ai-sdk";
import type { UIMessage } from "ai";
import type { ChatMessage } from "@/lib/types";

export * from "@shadcn/helpers/ai-sdk";

export function getMessageText(message: Pick<UIMessage, "parts">) {
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

export const DEMO_CHAT = createChat<ChatMessage>()
	.user("Add a dark mode toggle to the settings page.")
	.sleep(600)
	.assistant(({ writer }) => {
		writer.reasoning(
			"I need to know how themes are set up before I add a toggle. If next-themes is already in the layout, the toggle only has to call setTheme.",
		);
		writer.sleep(400);
		writer
			.tool("runCommand", { input: { command: "rg -l ThemeProvider app" } })
			.sleep(800)
			.output({ stdout: "app/layout.tsx" });
		writer.sleep(500);
		writer.text(`next-themes is already set up in \`app/layout.tsx\`, so the toggle only has to call \`setTheme\`.

**Changes**

- Added \`components/mode-toggle.tsx\` with a Light and Dark option.
- Put \`<ModeToggle />\` next to the Appearance heading in \`app/settings/page.tsx\`.

\`\`\`canopus
pattern NoPrep = [step="Data Modeling"] -> [step!="Model Evaluation"]* -> end
\`\`\`
`);
	})
	.user("Make it follow the system setting by default.")
	.sleep(600)
	.assistant(({ writer }) => {
		writer.reasoning(
			"The default theme lives on the ThemeProvider. I should check what it is set to now.",
		);
		writer.sleep(400);
		writer.tool("runCommand", {
			input: { command: "rg -n defaultTheme app/layout.tsx" },
			needsApproval: true,
			output: { stdout: "" },
		});
		writer.sleep(500);
	})
	.assistant(({ writer, toolCall }) => {
		writer.sleep(600);
		writer.text(
			toolCall?.approved
				? "Removed the dist folder."
				: "Okay, I left the dist folder in place.",
		);
	})
	.user("Run the build before I ship it.")
	.sleep(600)
	.assistant(({ writer }) => {
		writer
			.tool("runCommand", { input: { command: "pnpm build" } })
			.sleep(1600)
			.output({
				stdout:
					"▲ Next.js 16.0.0\n\n✓ Compiled successfully in 4.2s\n✓ Linting and checking validity of types\n✓ Generating static pages (12/12)",
			});
		writer.sleep(500);
		writer.text(`The build passes, so it is ready to ship.

- Compiled in **4.2s**.
- No lint or type errors.
- Generated all **12** static pages.
`);
	});
