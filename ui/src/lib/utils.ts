import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PatternGroup } from "@/lib/types";
import { metacharacterPLUS, metacharacterSTAR } from "@/configuration";

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
		? `Pattern[${pe.subpattern}]`
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
