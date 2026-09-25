export function checkConditionBase(
	src: string,
	tgt: string,
	useScoreEvolutionFilter: boolean,
	scoreEvolutionFilter: number,
	avgNodeScore: Record<string, number>,
) {
	if (!useScoreEvolutionFilter) return { ok: true, strict: false };
	if (src.startsWith("_PADDING_") || tgt.startsWith("_PADDING_"))
		return { ok: true, strict: false };

	const srcScore = avgNodeScore[src];
	const tgtScore = avgNodeScore[tgt];
	if (srcScore === undefined || tgtScore === undefined)
		return { ok: false, strict: false };

	const delta = tgtScore - srcScore;
	let ok = false;
	let strict = false;

	if (scoreEvolutionFilter === 1) {
		ok = delta <= 0;
		strict = delta < 0;
	} else if (scoreEvolutionFilter === 2) {
		ok = delta === 0;
	} else if (scoreEvolutionFilter === 3) {
		ok = delta >= 0;
		strict = delta > 0;
	} else {
		ok = true;
	}

	return { ok, strict };
}

function buildNodesByDepth(
	nodeScoresAcc: Record<string, number[]>,
	maxDepth: number,
) {
	const nodesByDepth: string[][] = Array.from({ length: maxDepth }, () => []);
	const regex = /\((\d+)\)$/;
	for (const nodeId of Object.keys(nodeScoresAcc)) {
		let d = 0;
		if (nodeId.startsWith("_PADDING_")) {
			d = Number.parseInt(nodeId.split("_")[2], 10) - 1;
		} else {
			const match = regex.exec(nodeId);
			if (match) d = Number.parseInt(match[1], 10) - 1;
		}
		if (d >= 0 && d < maxDepth) nodesByDepth[d].push(nodeId);
	}
	return nodesByDepth;
}

function processForwardTargets(
	src: string,
	targets: Set<string>,
	reach: Set<string>,
	reachStrict: Set<string>,
	useFilter: boolean,
	scoreFilter: number,
	avgNodeScore: Record<string, number>,
) {
	for (const tgt of targets) {
		const cond = checkConditionBase(
			src,
			tgt,
			useFilter,
			scoreFilter,
			avgNodeScore,
		);
		if (cond.ok) {
			if (reachStrict.has(src) || cond.strict) reachStrict.add(tgt);
			else reach.add(tgt);
		}
	}
}

function processForwardReachability(
	nodesByDepth: string[][],
	existingLinks: Record<string, Set<string>>,
	avgNodeScore: Record<string, number>,
	maxDepth: number,
	scoreFilter: number,
	useFilter: boolean,
) {
	const reach = new Set<string>();
	const reachStrict = new Set<string>();
	for (const nodeId of nodesByDepth[0]) reach.add(nodeId);

	for (let d = 0; d < maxDepth - 1; d++) {
		for (const src of nodesByDepth[d]) {
			if (!reach.has(src) && !reachStrict.has(src)) continue;
			const targets = existingLinks[src] || new Set();
			processForwardTargets(
				src,
				targets,
				reach,
				reachStrict,
				useFilter,
				scoreFilter,
				avgNodeScore,
			);
		}
	}
	return { reach, reachStrict };
}

function processBackwardTargets(
	src: string,
	targets: Set<string>,
	canReach: Set<string>,
	canReachStrict: Set<string>,
	useFilter: boolean,
	scoreFilter: number,
	avgNodeScore: Record<string, number>,
) {
	for (const tgt of targets) {
		const cond = checkConditionBase(
			src,
			tgt,
			useFilter,
			scoreFilter,
			avgNodeScore,
		);
		if (cond.ok) {
			if (canReach.has(tgt) || canReachStrict.has(tgt)) {
				if (canReachStrict.has(tgt) || cond.strict) canReachStrict.add(src);
				else canReach.add(src);
			}
		}
	}
}

function processBackwardReachability(
	nodesByDepth: string[][],
	existingLinks: Record<string, Set<string>>,
	avgNodeScore: Record<string, number>,
	maxDepth: number,
	scoreFilter: number,
	useFilter: boolean,
) {
	const canReach = new Set<string>();
	const canReachStrict = new Set<string>();
	if (maxDepth === 0) return { canReach, canReachStrict };

	for (const nodeId of nodesByDepth[maxDepth - 1]) canReach.add(nodeId);
	for (let d = maxDepth - 2; d >= 0; d--) {
		for (const src of nodesByDepth[d]) {
			const targets = existingLinks[src] || new Set();
			processBackwardTargets(
				src,
				targets,
				canReach,
				canReachStrict,
				useFilter,
				scoreFilter,
				avgNodeScore,
			);
		}
	}
	return { canReach, canReachStrict };
}

export function computeReachability(
	nodeScoresAcc: Record<string, number[]>,
	existingLinks: Record<string, Set<string>>,
	avgNodeScore: Record<string, number>,
	maxDepth: number,
	scoreEvolutionFilter: number,
	useScoreEvolutionFilter: boolean,
) {
	const nodesByDepth = buildNodesByDepth(nodeScoresAcc, maxDepth);
	const forward = processForwardReachability(
		nodesByDepth,
		existingLinks,
		avgNodeScore,
		maxDepth,
		scoreEvolutionFilter,
		useScoreEvolutionFilter,
	);
	const backward = processBackwardReachability(
		nodesByDepth,
		existingLinks,
		avgNodeScore,
		maxDepth,
		scoreEvolutionFilter,
		useScoreEvolutionFilter,
	);
	return {
		reachableFromStart: forward.reach,
		reachableFromStartStrict: forward.reachStrict,
		canReachEnd: backward.canReach,
		canReachEndStrict: backward.canReachStrict,
	};
}
