import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn, scoreToBandColor } from "@/lib/utils";
import { useColombusStore } from "@/store";

const ProfileExplorerPpmResultsBar: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const [resultSearchFilter, setResultSearchFilter] = useState("");
	const availableProfilesNames = useColombusStore(
		(state) => state.availableProfilesNames,
	);
	const availableProfilesWithPpmData = useColombusStore(
		(state) => state.availableProfilesWithPpmData,
	);
	const filteredProfilesNames = useColombusStore(
		(state) => state.filteredProfilesNames,
	);
	const setFilteredProfilesNames = useColombusStore(
		(state) => state.setFilteredProfilesNames,
	);
	const profilesScores = useColombusStore((state) => state.profilesScores);
	const profiles = useMemo(() => {
		return availableProfilesNames.map((name) => {
			const profileData = availableProfilesWithPpmData.find(
				(profile) => profile.profile_name === name,
			);
			const resultCount = profileData?.results.length ?? 0;
			const score = profilesScores[name];

			return {
				key: name,
				name,
				resultCount,
				score,
			};
		});
	}, [availableProfilesNames, availableProfilesWithPpmData, profilesScores]);

	const filteredProfiles = useMemo(() => {
		return profiles.filter((profile) =>
			profile.name.toLowerCase().includes(resultSearchFilter.toLowerCase()),
		);
	}, [profiles, resultSearchFilter]);

	const selectedProfiles = useMemo(() => {
		return filteredProfilesNames.filter((name) =>
			profiles.some((p) => p.key === name),
		);
	}, [filteredProfilesNames, profiles]);

	const selectedCount = useMemo(() => {
		return profiles.filter((p) => selectedProfiles.includes(p.key)).length;
	}, [profiles, selectedProfiles]);

	const allProfilesSelected = useMemo(() => {
		return (
			filteredProfiles.length > 0 &&
			filteredProfiles.every((p) => selectedProfiles.includes(p.key))
		);
	}, [filteredProfiles, selectedProfiles]);

	const toggleProfile = (key: string) => {
		if (selectedProfiles.includes(key)) {
			setFilteredProfilesNames(selectedProfiles.filter((n) => n !== key));
		} else {
			setFilteredProfilesNames([...selectedProfiles, key]);
		}
	};

	const toggleAll = () => {
		if (allProfilesSelected) {
			setFilteredProfilesNames([]);
		} else {
			setFilteredProfilesNames(filteredProfiles.map((p) => p.key));
		}
	};

	return (
		<section
			{...divProps}
			className={cn(
				"flex h-[calc(100vh-76px)] min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
				divProps.className,
			)}
		>
			<h3 className="mb-2 text-sm font-semibold text-slate-900">
				Results ({selectedCount}/{profiles.length})
			</h3>

			<Input
				type="text"
				placeholder="Search profiles..."
				value={resultSearchFilter}
				onChange={(e) => setResultSearchFilter(e.target.value)}
				className="mb-2"
			/>

			{/* biome-ignore lint/a11y/useSemanticElements: cannot use <button> here as Checkbox (Radix UI) renders a <button> internally, nesting buttons is invalid HTML */}
			<div
				role="button"
				tabIndex={0}
				onClick={toggleAll}
				onKeyDown={(e) =>
					e.key === "Enter" || e.key === " " ? toggleAll() : undefined
				}
				className="mb-2 mt-1 flex w-full cursor-pointer items-center gap-2 rounded-md border-b border-slate-100 pb-2 text-left"
			>
				<Checkbox
					checked={allProfilesSelected}
					onCheckedChange={toggleAll}
					className="pointer-events-none border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:text-white"
				/>
				<span className="text-sm font-semibold text-slate-900">Select all</span>
			</div>

			<div className="min-h-0 flex-1 overflow-auto pr-1">
				{profiles.length === 0 ? (
					<div className="px-1 py-2 text-xs text-slate-400">
						No profiles found
					</div>
				) : (
					<ScrollArea className="h-full pr-1">
						<div className="space-y-1">
							{filteredProfiles.map((profile, index) => {
								const isSelected = selectedProfiles.includes(profile.key);

								return (
									<div
										key={`${profile.key}-${index}`}
										className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-slate-50"
									>
										<Checkbox
											id={`cb_${profile.key}-${index}`}
											checked={isSelected}
											onCheckedChange={() => toggleProfile(profile.key)}
											className="border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:text-white"
										/>
										<div
											className="h-3 w-3 shrink-0 rounded-full"
											style={{
												backgroundColor: scoreToBandColor(profile.score),
											}}
										/>
										<label
											htmlFor={`cb_${profile.key}-${index}`}
											className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700 cursor-pointer"
											style={{ fontFamily: "JetBrains Mono, monospace" }}
										>
											{profile.name}
										</label>
										<span className="shrink-0 text-[10px] font-bold text-slate-900">
											{profile.score !== undefined && profile.score !== null
												? profile.score.toFixed(2)
												: "-"}
										</span>
									</div>
								);
							})}
						</div>
						<ScrollBar />
					</ScrollArea>
				)}
			</div>
		</section>
	);
};

export default ProfileExplorerPpmResultsBar;
