import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { metacharacterPLUS, metacharacterSTAR } from "@/configuration";
import type { PatternGroup } from "@/lib/types";

/**
 * Merge the given tailwind class values.
 *
 * @param inputs the class values
 * @returns the tailwind merged classes
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatPatternGroup(pe: PatternGroup) {
	let preprocessedName = pe.subpattern
		? `Pattern[${pe.subpattern.name}]`
		: pe.steps?.join(" OR ");
	if (pe.metaCharacters?.negate) {
		preprocessedName = `NOT (${preprocessedName})`;
	}
	if (pe.multiplicity === metacharacterSTAR) {
		preprocessedName = `ZERO OR MORE (${preprocessedName})`;
	}
	if (pe.multiplicity === metacharacterPLUS) {
		preprocessedName = `AT LEAST ONE (${preprocessedName})`;
	}
	if (pe.metaCharacters?.startsWith && pe.metaCharacters.endsWith) {
		preprocessedName = `STARTS AND ENDS WITH (${preprocessedName})`;
	} else if (pe.metaCharacters?.startsWith) {
		preprocessedName = `STARTS WITH (${preprocessedName})`;
	} else if (pe.metaCharacters?.endsWith) {
		preprocessedName = `ENDS WITH (${preprocessedName})`;
	}
	return preprocessedName;
}

/**
 * Convert a score to a band color hex code.
 * Returns a grey color when the score is undefined.
 *
 * @param score the score value (0 to 1) or undefined
 * @returns the hex color string
 */
export function scoreToBandColor(score: number | null | undefined) {
	if (score === undefined || score === null) return "#94a3b8";
	if (score <= 0.2) return "#ef4444";
	if (score <= 0.4) return "#f59e0b";
	if (score <= 0.6) return "#facc15";
	if (score <= 0.8) return "#a7f3d0";
	return "#22c55e";
}

export const hexToRgba = (hex: string, alpha: number) => {
	const r = parseInt(hex.slice(1, 3), 16) || 0;
	const g = parseInt(hex.slice(3, 5), 16) || 0;
	const b = parseInt(hex.slice(5, 7), 16) || 0;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function scoreToContinuousColor(score: number | null | undefined) {
	if (score === undefined || score === null) return "#94a3b8";
	// Snaps to 0.01 increments
	const s = Math.max(0, Math.min(1, Math.round(score * 100) / 100));

	const colors = [
		{ r: 239, g: 68, b: 68 }, // #ef4444
		{ r: 245, g: 158, b: 11 }, // #f59e0b
		{ r: 250, g: 204, b: 21 }, // #facc15
		{ r: 167, g: 243, b: 208 }, // #a7f3d0
		{ r: 34, g: 197, b: 94 }, // #22c55e
	];

	const scaled = s * 4;
	const index = Math.floor(scaled);
	if (index >= 4) return "#22c55e";

	const c1 = colors[index];
	const c2 = colors[index + 1];
	const ratio = scaled - index;

	const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
	const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
	const b = Math.round(c1.b + (c2.b - c1.b) * ratio);

	const toHex = (c: number) => c.toString(16).padStart(2, "0");
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
