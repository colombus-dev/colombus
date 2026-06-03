import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import useScoreDistribution from "@/hooks/useScoreDistribution";

export default function ProfileScoreDistributionChart() {
	const { average, bands, hasData, chartData } = useScoreDistribution();

	return (
		<div className="w-full h-full">
			<div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] w-full h-full flex flex-col">
				<div className="mb-6 text-center w-full shrink-0">
					<h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
						Notebooks average
					</h2>
					<p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
						Global score distribution
					</p>
				</div>

				<div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 w-full">
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
								className={`border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 flex flex-col space-y-1.5 transition-all duration-150 ${
									band.count > 0
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
