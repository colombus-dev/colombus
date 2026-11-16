import React, { useMemo, useState } from "react";
import { SectionHeading } from "@/components/section-heading";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, scoreToBandColor } from "@/lib/utils";
import { useColombusStore } from "@/store";

interface ProfileExplorerPpmResultsBarProps
	extends React.HTMLAttributes<HTMLDivElement> {
	isLoading?: boolean;
}

const SKELETON_ROWS = ["a", "b", "c", "d", "e", "f", "g", "h"];

const ProfileExplorerPpmResultsBar: React.FunctionComponent<
	ProfileExplorerPpmResultsBarProps
> = ({ isLoading = false, className, ...divProps }) => {
	const [resultSearchFilter, setResultSearchFilter] = useState("");
	const availableProfilesNames = useColombusStore(
		(state) => state.availableProfilesNames,
	);
	const filteredProfilesNames = useColombusStore(
		(state) => state.filteredProfilesNames,
	);
	const setFilteredProfilesNames = useColombusStore(
		(state) => state.setFilteredProfilesNames,
	);
	const selectedProfileName = useColombusStore(
		(state) => state.selectedProfileName,
	);
	const profilesScores = useColombusStore((state) => state.profilesScores);

	const selectedNames = useMemo(() => {
		const available = new Set(availableProfilesNames);
		return new Set(filteredProfilesNames.filter((n) => available.has(n)));
	}, [availableProfilesNames, filteredProfilesNames]);

	const visibleNames = useMemo(() => {
		const query = resultSearchFilter.trim().toLowerCase();
		return query === ""
			? availableProfilesNames
			: availableProfilesNames.filter((n) => n.toLowerCase().includes(query));
	}, [availableProfilesNames, resultSearchFilter]);

	const allVisibleSelected =
		visibleNames.length > 0 && visibleNames.every((n) => selectedNames.has(n));

	const toggleProfile = (name: string) => {
		const next = new Set(selectedNames);
		if (next.has(name)) {
			next.delete(name);
		} else {
			next.add(name);
		}
		setFilteredProfilesNames([...next]);
	};

	const toggleAll = () => {
		setFilteredProfilesNames(allVisibleSelected ? [] : visibleNames);
	};

	React.useEffect(() => {
		if (selectedProfileName === null) {
			return;
		}
		const timer = setTimeout(() => {
			document
				.getElementById(`result-item-${selectedProfileName}`)
				?.scrollIntoView({ behavior: "smooth", block: "nearest" });
		}, 50);
		return () => clearTimeout(timer);
	}, [selectedProfileName]);

	const renderList = () => {
		if (isLoading) {
			return (
				<div className="space-y-1.5 px-1">
					{SKELETON_ROWS.map((key) => (
						<div key={key} className="h-6 animate-pulse rounded bg-muted" />
					))}
				</div>
			);
		}
		if (availableProfilesNames.length === 0) {
			return (
				<p className="px-1 py-2 text-xs text-muted-foreground">
					No profiles yet.
				</p>
			);
		}
		if (visibleNames.length === 0) {
			return (
				<p className="px-1 py-2 text-xs text-muted-foreground">
					No matching profiles.
				</p>
			);
		}
		return (
			<ul className="space-y-0.5">
				{visibleNames.map((name) => {
					const score = profilesScores[name];
					const checkboxId = `result-cb-${name}`;
					return (
						<li
							key={name}
							id={`result-item-${name}`}
							className={cn(
								"flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-muted",
								name === selectedProfileName && "bg-muted",
							)}
						>
							<Checkbox
								id={checkboxId}
								checked={selectedNames.has(name)}
								onCheckedChange={() => toggleProfile(name)}
							/>
							<span
								aria-hidden="true"
								className="size-2 shrink-0 rounded-full"
								style={{ backgroundColor: scoreToBandColor(score) }}
							/>
							<Label
								htmlFor={checkboxId}
								className="min-w-0 flex-1 cursor-pointer truncate text-xs font-normal"
							>
								{name}
							</Label>
							<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
								{score !== undefined && score !== null ? score.toFixed(2) : "-"}
							</span>
						</li>
					);
				})}
			</ul>
		);
	};

	return (
		<section
			{...divProps}
			className={cn(
				"flex h-full min-h-0 flex-col gap-2 rounded-xl border bg-card p-3",
				className,
			)}
		>
			<SectionHeading
				title="Results"
				actions={
					!isLoading && (
						<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
							{selectedNames.size}/{availableProfilesNames.length}
						</span>
					)
				}
			/>
			<Input
				type="search"
				aria-label="Search profiles"
				placeholder="Search profiles..."
				value={resultSearchFilter}
				onChange={(e) => setResultSearchFilter(e.target.value)}
				className="h-8"
				disabled={isLoading}
			/>
			<div className="flex items-center gap-2 border-b px-1 pb-2">
				<Checkbox
					id="result-cb-select-all"
					checked={allVisibleSelected}
					onCheckedChange={toggleAll}
					disabled={isLoading || visibleNames.length === 0}
				/>
				<Label
					htmlFor="result-cb-select-all"
					className="cursor-pointer text-xs font-medium"
				>
					Select all
				</Label>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto">{renderList()}</div>
		</section>
	);
};

export default ProfileExplorerPpmResultsBar;
