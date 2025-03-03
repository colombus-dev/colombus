import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PatternElement } from "@/lib/types";
import {
	metacharacterENDS,
	metacharacterNOT,
	metacharacterOR,
	metacharacterPLUS,
	metacharacterSTAR,
	metacharacterSTARTS,
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
 * - ZERO OR MORE (Any step not in next group) for empty * groups
 * - AT LEAST ONE (...) for + groups
 *
 * @param pe the pattern element to format to string
 * @returns the string representation of the pattern element
 */
export function formatPatternElement(pe: PatternElement) {
	let preprocessedName = pe.name
		.split(metacharacterOR)
		.map((s) =>
			s === metacharacterSTAR
				? "Any step not in next group"
				: `"${s
						.replace(metacharacterSTARTS, "")
						.replace(metacharacterENDS, "")
						.replace(metacharacterNOT, "")
						.replace(metacharacterSTAR, "")
						.replace(metacharacterPLUS, "")}"`,
		)
		.join(" OR ");
	if (pe.type === "subpattern") {
		preprocessedName = `Pattern[${preprocessedName}]`;
	}
	if (pe.name.replace(metacharacterSTARTS, "").startsWith(metacharacterNOT)) {
		preprocessedName = `NOT (${preprocessedName})`;
	}
	if (pe.name.replace(metacharacterENDS, "").endsWith(metacharacterSTAR)) {
		preprocessedName = `ZERO OR MORE (${preprocessedName})`;
	}
	if (pe.name.replace(metacharacterENDS, "").endsWith(metacharacterPLUS)) {
		preprocessedName = `AT LEAST ONE (${preprocessedName})`;
	}
	if (pe.name.startsWith(metacharacterSTARTS) && pe.name.endsWith(metacharacterENDS)) {
		preprocessedName = `STARTS AND ENDS WITH (${preprocessedName})`;
	} else if (pe.name.startsWith(metacharacterSTARTS)) {
		preprocessedName = `STARTS WITH (${preprocessedName})`;
	} else if (pe.name.endsWith(metacharacterENDS)) {
		preprocessedName = `ENDS WITH (${preprocessedName})`;
	}
	return preprocessedName;
}
