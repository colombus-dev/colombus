import type { GraphDefinition, StepNode } from "@/api/client";

export function calculateMaxDepth(
	nodes: GraphDefinition[],
	filteredProfilesNames: string[],
): number {
	let maxDepth = 0;
	for (const profile of nodes) {
		if (!filteredProfilesNames.includes(profile.name)) continue;
		if (profile.steps.length > maxDepth) maxDepth = profile.steps.length;
	}
	return maxDepth;
}

export function unrollSteps(steps: StepNode[], maxDepth: number): string[] {
	const unrolledIds: string[] = [];
	for (let i = 0; i < maxDepth; i++) {
		if (i < steps.length) {
			const stepName = steps[i].name.replace(/ \(\d+\)$/, "").trim();
			unrolledIds.push(`${stepName} (${i + 1})`);
		} else {
			unrolledIds.push(`_PADDING_${i + 1}`);
		}
	}
	return unrolledIds;
}

function processProfileTopology(
	profile: GraphDefinition,
	score: number,
	maxDepth: number,
	nodeScoresAcc: Record<string, number[]>,
	existingLinks: Record<string, Set<string>>,
) {
	const steps = [...profile.steps].sort((a, b) => a.position - b.position);
	const unrolledIds = unrollSteps(steps, maxDepth);

	for (const stepName of unrolledIds) {
		if (!nodeScoresAcc[stepName]) nodeScoresAcc[stepName] = [];
		nodeScoresAcc[stepName].push(score);
	}

	for (let i = 0; i < unrolledIds.length - 1; i++) {
		const src = unrolledIds[i];
		const tgt = unrolledIds[i + 1];
		if (!existingLinks[src]) existingLinks[src] = new Set();
		existingLinks[src].add(tgt);
	}
}

export function buildGraphTopology(
	nodes: GraphDefinition[],
	filteredProfilesNames: string[],
	profilesScores: Record<string, number | null | undefined>,
	maxDepth: number,
) {
	const nodeScoresAcc: Record<string, number[]> = {};
	const existingLinks: Record<string, Set<string>> = {};

	for (const profile of nodes) {
		if (!filteredProfilesNames.includes(profile.name)) continue;
		const score = profilesScores?.[profile.name];
		if (score === undefined || score === null) continue;
		processProfileTopology(
			profile,
			score,
			maxDepth,
			nodeScoresAcc,
			existingLinks,
		);
	}

	const avgNodeScore: Record<string, number> = {};
	for (const [nodeId, scores] of Object.entries(nodeScoresAcc)) {
		avgNodeScore[nodeId] = scores.reduce((a, b) => a + b, 0) / scores.length;
	}

	return { nodeScoresAcc, existingLinks, avgNodeScore };
}
