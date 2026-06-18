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
