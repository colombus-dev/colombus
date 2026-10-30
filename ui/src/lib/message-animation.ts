import type { Variants } from "motion/react";

const MESSAGE_ANIMATION = {
	id: "slide-up",
	name: "Slide Up",
	variants: {
		initial: { opacity: 0, y: 10 },
		animate: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
		},
		exit: { opacity: 0, y: 4, transition: { duration: 0.15 } },
	},
} as const satisfies {
	id: string;
	name: string;
	variants: Variants;
};

type MessageAnimationPreset = typeof MESSAGE_ANIMATION;
type MessageAnimationId = MessageAnimationPreset["id"];

export {
	MESSAGE_ANIMATION,
	type MessageAnimationId,
	type MessageAnimationPreset,
};
