import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PatternElement } from "@/lib/types";
import {
	specialCharacterNOT,
	specialCharacterOR,
	specialCharacterPLUS,
	specialCharacterSTAR,
} from "@/configuration";

/**
 * Merge the given tailwind class values.
 *
 * @param inputs the class values
 * @returns the tailwind merged classes
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Format the given PatternElement to its string representation.
 *
 * - Pattern[...] for subpattern
 * - a OR b for OR groups
 * - NOT (...) for negation groups
 * - ZERO OR MORE (...) for * groups
 * - ZERO OR MORE (Any step) for empty * groups
 * - AT LEAST ONE (...) for + groups
 *
 * @param pe the pattern element to format to string
 * @returns the string representation of the pattern element
 */
export function formatPatternElement(pe: PatternElement) {
	let preprocessedName = pe.name
		.split(specialCharacterOR)
		.map((s) =>
			s === specialCharacterSTAR
				? "Any step"
				: `"${s
						.replace(specialCharacterNOT, "")
						.replace(specialCharacterSTAR, "")
						.replace(specialCharacterPLUS, "")}"`,
		)
		.join(" OR ");
	if (pe.type === "subpattern") {
		preprocessedName = `Pattern[${preprocessedName}]`;
	}
	if (pe.name.startsWith(specialCharacterNOT)) {
		preprocessedName = `NOT (${preprocessedName})`;
	}
	if (pe.name.endsWith(specialCharacterSTAR)) {
		preprocessedName = `ZERO OR MORE (${preprocessedName})`;
	}
	if (pe.name.endsWith(specialCharacterPLUS)) {
		preprocessedName = `AT LEAST ONE (${preprocessedName})`;
	}
	return preprocessedName;
}
