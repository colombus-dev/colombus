import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import ProjectTaxonomyList from "@/components/project-taxonomy-list";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useColombusStore } from "@/store";

const ProfileExplorer2GraphSettingsBar: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const referenceDiffProfile = useColombusStore(
		(state) => state.referenceDiffProfile,
	);
	const currentPattern = useColombusStore((state) => state.currentPattern);

	const useScoreEvolutionFilter = useColombusStore(
		(state) => state.useScoreEvolutionFilter,
	);
	const setUseScoreEvolutionFilter = useColombusStore(
		(state) => state.setUseScoreEvolutionFilter,
	);
	const scoreEvolutionFilter = useColombusStore(
		(state) => state.scoreEvolutionFilter,
	);
	const setScoreEvolutionFilter = useColombusStore(
		(state) => state.setScoreEvolutionFilter,
	);
	const pathsDisplayMode = useColombusStore((state) => state.pathsDisplayMode);
	const setPathsDisplayMode = useColombusStore(
		(state) => state.setPathsDisplayMode,
	);

	return (
		<div
			{...divProps}
			className={`flex flex-col h-full overflow-hidden space-y-4 ${divProps.className ?? ""}`}
		>
			<div className="space-y-4 shrink-0">
				<div className="space-y-2">
					<div className="flex flex-col space-y-4">
						<div className="flex flex-col space-y-2">
							<p className="font-bold mb-1">Score Trend</p>
							<input
								type="range"
								min="1"
								max="3"
								step="1"
								value={useScoreEvolutionFilter ? scoreEvolutionFilter : 2}
								onChange={(e) => {
									const val = Number.parseInt(e.target.value, 10);
									if (val === 2) {
										setUseScoreEvolutionFilter(false);
									} else {
										setUseScoreEvolutionFilter(true);
										setScoreEvolutionFilter(val);
									}
								}}
								className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-slate-100 dark:bg-slate-700"
							/>
							<div className="flex items-center justify-between px-1 text-slate-400 pt-1">
								<TrendingDown
									className={`w-5 h-5 transition-colors ${useScoreEvolutionFilter && scoreEvolutionFilter === 1 ? "text-slate-900 dark:text-slate-100" : ""}`}
								/>
								<Minus
									className={`w-5 h-5 transition-colors ${!useScoreEvolutionFilter ? "text-slate-900 dark:text-slate-100" : ""}`}
								/>
								<TrendingUp
									className={`w-5 h-5 transition-colors ${useScoreEvolutionFilter && scoreEvolutionFilter === 3 ? "text-slate-900 dark:text-slate-100" : ""}`}
								/>
							</div>
						</div>

						<div className="flex flex-col space-y-2 mt-4">
							<p className="font-bold">Customization</p>
							<RadioGroup
								key="radio-ppm-nodes-display-div"
								value={
									pathsDisplayMode === "show-variable"
										? "show-fixed"
										: pathsDisplayMode
								}
								onValueChange={(value) =>
									// biome-ignore lint/suspicious/noExplicitAny: Temporary workaround
									setPathsDisplayMode(value as any)
								}
								disabled={!referenceDiffProfile && !currentPattern}
								className="flex flex-col space-y-2 mt-1"
							>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="show-all" id="show-all" />
									<label
										htmlFor="show-all"
										className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Show all paths
									</label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="show-fixed" id="show-fixed" />
									<label
										htmlFor="show-fixed"
										className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Show matching paths
									</label>
								</div>
							</RadioGroup>
						</div>
					</div>
				</div>
			</div>
			<ProjectTaxonomyList className="flex-1 min-h-0 mt-1" />
		</div>
	);
};

export default ProfileExplorer2GraphSettingsBar;
