import { useMemo } from "react";
import { scoreToBandColor } from "@/lib/utils";
import { useColombusStore } from "@/store";

export interface ScoreBand {
	min: number;
	max: number;
	label: string;
	color: string;
	count: number;
}

export interface ChartDataEntry {
	name: string;
	value: number;
	color: string;
}

export default function useScoreDistribution() {
	const profilesScores = useColombusStore((state) => state.profilesScores);
	const filteredProfilesNames = useColombusStore(
		(state) => state.filteredProfilesNames,
	);

	const { average, bands, hasData, chartData } = useMemo(() => {
		const scores: number[] = [];
		let noScoreCount = 0;

		for (const name of filteredProfilesNames) {
			const score = profilesScores[name];
			if (typeof score === "number" && score !== null && !Number.isNaN(score)) {
				scores.push(score);
			} else {
				noScoreCount++;
			}
		}

		const totalWithScore = scores.length;
		const sum = scores.reduce((a, b) => a + b, 0);
		const avg = totalWithScore > 0 ? sum / totalWithScore : 0;

		const bandsList: ScoreBand[] = [
			{
				min: 0.0,
				max: 0.2,
				label: "0 - 0.2",
				color: scoreToBandColor(0.1),
				count: 0,
			},
			{
				min: 0.21,
				max: 0.4,
				label: "0.21 - 0.4",
				color: scoreToBandColor(0.3),
				count: 0,
			},
			{
				min: 0.41,
				max: 0.6,
				label: "0.41 - 0.6",
				color: scoreToBandColor(0.5),
				count: 0,
			},
			{
				min: 0.61,
				max: 0.8,
				label: "0.61 - 0.8",
				color: scoreToBandColor(0.7),
				count: 0,
			},
			{
				min: 0.81,
				max: 1.0,
				label: "0.81 - 1",
				color: scoreToBandColor(0.9),
				count: 0,
			},
			{
				min: -1,
				max: -1,
				label: "Sans note",
				color: scoreToBandColor(null),
				count: noScoreCount,
			},
		];

		for (const score of scores) {
			if (score >= 0 && score <= 0.2) {
				bandsList[0].count++;
			} else if (score > 0.2 && score <= 0.4) {
				bandsList[1].count++;
			} else if (score > 0.4 && score <= 0.6) {
				bandsList[2].count++;
			} else if (score > 0.6 && score <= 0.8) {
				bandsList[3].count++;
			} else if (score > 0.8 && score <= 1.0) {
				bandsList[4].count++;
			}
		}

		const activeBands = bandsList.filter((b) => b.count > 0);
		const hasActiveData = activeBands.length > 0;

		const donutData: ChartDataEntry[] = hasActiveData
			? activeBands.map((b) => ({
				name: b.label,
				value: b.count,
				color: b.color,
			}))
			: [{ name: "No data", value: 1, color: "#e2e8f0" }];

		return {
			average: avg,
			bands: bandsList,
			hasData: hasActiveData,
			chartData: donutData,
		};
	}, [filteredProfilesNames, profilesScores]);

	return { average, bands, hasData, chartData };
}
