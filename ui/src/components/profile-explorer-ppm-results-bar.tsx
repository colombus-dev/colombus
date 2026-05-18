import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";

function scoreToBandColor(score: number) {
	if (score <= 0.2) return "#ef4444";
	if (score <= 0.4) return "#f59e0b";
	if (score <= 0.6) return "#facc15";
	if (score <= 0.8) return "#a7f3d0";
	return "#22c55e";
}

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
	const maxScore = useMemo(() => {
		return availableProfilesWithPpmData.reduce((max, profile) => {
			return Math.max(max, profile.results.length);
		}, 0);
	}, [availableProfilesWithPpmData]);

	const profiles = useMemo(() => {
		return availableProfilesNames.map((name) => {
			const profileData = availableProfilesWithPpmData.find(
				(profile) => profile.profile_name === name,
			);
			const resultCount = profileData?.results.length ?? 0;
			const score = maxScore > 0 ? resultCount / maxScore : 0;

			return {
				name,
				resultCount,
				score,
			};
		});
	}, [availableProfilesNames, availableProfilesWithPpmData, maxScore]);

	const uniqueProfiles = useMemo(() => {
		const seen = new Set<string>();
		return profiles.filter((profile) => {
			if (seen.has(profile.name)) {
				return false;
			}
			seen.add(profile.name);
			return true;
		});
	}, [profiles]);

	const uniqueSelectedProfiles = useMemo(
		() => [...new Set(filteredProfilesNames)],
		[filteredProfilesNames],
	);

	const selectedProfiles = uniqueSelectedProfiles;
	const allProfilesSelected =
		uniqueProfiles.length > 0 &&
		selectedProfiles.length === uniqueProfiles.length;
	const totalProfilesLabel = uniqueProfiles.length.toLocaleString("fr-FR");
	const selectedProfilesLabel = selectedProfiles.length.toLocaleString("fr-FR");

	const toggleAll = () => {
		if (allProfilesSelected) {
			setFilteredProfilesNames([]);
			return;
		}

		setFilteredProfilesNames(uniqueProfiles.map((profile) => profile.name));
	};

	const toggleProfile = (profileName: string) => {
		if (selectedProfiles.includes(profileName)) {
			setFilteredProfilesNames(
				selectedProfiles.filter((selectedProfile) => selectedProfile !== profileName),
			);
			return;
		}

		setFilteredProfilesNames([...selectedProfiles, profileName]);
	};

	const filteredProfiles = useMemo(() => {
		const normalizedFilter = resultSearchFilter.trim().toLowerCase();
		const sortedProfiles = [...uniqueProfiles].sort((left, right) => {
			if (left.score !== right.score) {
				return left.score - right.score;
			}

			return left.name.localeCompare(right.name);
		});

		return normalizedFilter.length > 0
			? sortedProfiles.filter((profile) =>
				profile.name.toLowerCase().includes(normalizedFilter),
			)
			: sortedProfiles;
	}, [profiles, resultSearchFilter]);

	return (
		<section
			{...divProps}
			className={cn(
				"flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
				divProps.className,
			)}
		>
			<div className="mb-3 flex items-center justify-between gap-3">
				<span className="text-sm font-semibold text-slate-900">Résultats</span>
				<span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-900">
					{selectedProfilesLabel} / {totalProfilesLabel}
				</span>
			</div>

			<Input
				id="filter-results"
				type="text"
				placeholder="Profils de recherche"
				value={resultSearchFilter}
				onChange={(event) => setResultSearchFilter(event.target.value)}
			/>

			<button
				type="button"
				onClick={toggleAll}
				className="mb-2 mt-3 flex w-full items-center gap-2 rounded-md border-b border-slate-100 pb-2 text-left"
			>
				<Checkbox
					checked={allProfilesSelected}
					onCheckedChange={toggleAll}
					className="pointer-events-none border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:text-white"
				/>
				<span className="text-sm font-semibold text-slate-900">Cochez tout</span>
			</button>

			<div className="min-h-0 flex-1 overflow-auto pr-1">
				{uniqueProfiles.length === 0 ? (
					<div className="px-1 py-2 text-xs text-slate-400">
						Aucun profil trouvé
					</div>
				) : (
					<ScrollArea className="h-full pr-1">
						<div className="space-y-1">
							{filteredProfiles.map((profile) => {
								const isSelected = selectedProfiles.includes(profile.name);

								return (
									<button
										key={profile.name}
										type="button"
										onClick={() => toggleProfile(profile.name)}
										className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-slate-50"
									>
										<Checkbox
											checked={isSelected}
											onCheckedChange={() => toggleProfile(profile.name)}
											className="pointer-events-none border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:text-white"
										/>
										<div
											className="h-3 w-3 shrink-0 rounded-full"
											style={{ backgroundColor: scoreToBandColor(profile.score) }}
										/>
										<span
											className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700"
											style={{ fontFamily: "JetBrains Mono, monospace" }}
										>
											{profile.name}
										</span>
										<span className="shrink-0 text-[10px] font-bold text-slate-900">
											{profile.resultCount}
										</span>
									</button>
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
