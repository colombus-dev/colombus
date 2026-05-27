import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { scoreToBandColor } from "@/lib/utils";
import { useColombusStore } from "@/store";

interface ScoreBand {
	min: number;
	max: number;
	label: string;
	color: string;
	count: number;
}

export default function ProfileScoreDistributionChart() {
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

		// Calculate average excluding notebooks without scores
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

		const donutData = hasActiveData
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

	return (
		<div className="space-y-6">
			<div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] max-w-3xl">
				<div className="mb-6">
					<h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
						Notebooks average
					</h3>
					<p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
						Global score distribution
					</p>
				</div>

				<div className="flex flex-col md:flex-row items-center justify-between gap-8">
					<div className="relative w-64 h-64 flex-shrink-0 flex items-center justify-center">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={chartData}
									cx="50%"
									cy="50%"
									innerRadius={70}
									outerRadius={90}
									paddingAngle={hasData ? 4 : 0}
									dataKey="value"
								>
									{chartData.map((entry) => (
										<Cell
											key={`cell-${entry.name}`}
											fill={entry.color}
											stroke={entry.color}
										/>
									))}
								</Pie>
							</PieChart>
						</ResponsiveContainer>

						<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
							<span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
								Average
							</span>
							<span className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">
								{average.toFixed(2)}
							</span>
						</div>
					</div>

					<div className="flex-1 w-full grid grid-cols-2 gap-3 sm:grid-cols-3">
						{bands.map((band) => (
							<div
								key={band.label}
								className={`border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 flex flex-col space-y-1.5 transition-all duration-150 ${band.count > 0
										? "bg-slate-50/50 dark:bg-slate-900/50 shadow-sm"
										: "bg-transparent opacity-60"
									}`}
							>
								<span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
									{band.label}
								</span>
								<div className="flex items-center space-x-2.5">
									<span
										className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm transition-transform hover:scale-110"
										style={{ backgroundColor: band.color }}
									/>
									<div className="flex flex-col leading-none">
										<span className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
											{band.count}
										</span>
										<span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
											notebooks
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
