import React, { useMemo, useState } from "react";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_SELECTED_PROFILES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";

interface ProfileExplorerPpmResultsBarProps
	extends React.HTMLAttributes<HTMLDivElement> {
	isLoading?: boolean;
	error?: string | null;
	hasPattern?: boolean;
}

const SKELETON_ROWS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RENDER_CHUNK_SIZE = 200;
const LOAD_MORE_THRESHOLD_PX = 200;

const ProfileExplorerPpmResultsBar: React.FunctionComponent<
	ProfileExplorerPpmResultsBarProps
> = ({
	isLoading = false,
	error = null,
	hasPattern = false,
	className,
	...divProps
}) => {
	const [resultSearchFilter, setResultSearchFilter] = useState("");
	const [renderCount, setRenderCount] = useState(RENDER_CHUNK_SIZE);
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
	const selectedProfileName = useColombusStore(
		(state) => state.selectedProfileName,
	);

	const selectedNames = useMemo(() => {
		const available = new Set(availableProfilesNames);
		return new Set(filteredProfilesNames.filter((n) => available.has(n)));
	}, [availableProfilesNames, filteredProfilesNames]);

	const matchCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const { profile_name } of availableProfilesWithPpmData) {
			counts.set(profile_name, (counts.get(profile_name) ?? 0) + 1);
		}
		return counts;
	}, [availableProfilesWithPpmData]);

	const visibleNames = useMemo(() => {
		const query = resultSearchFilter.trim().toLowerCase();
		return query === ""
			? availableProfilesNames
			: availableProfilesNames.filter((n) => n.toLowerCase().includes(query));
	}, [availableProfilesNames, resultSearchFilter]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset the rendered chunk when the list changes
	React.useEffect(() => {
		setRenderCount(RENDER_CHUNK_SIZE);
	}, [visibleNames]);

	const handleListScroll = (event: React.UIEvent<HTMLDivElement>) => {
		const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
		if (
			renderCount < visibleNames.length &&
			scrollTop + clientHeight >= scrollHeight - LOAD_MORE_THRESHOLD_PX
		) {
			setRenderCount((count) => count + RENDER_CHUNK_SIZE);
		}
	};

	const isSelectionFull = selectedNames.size >= MAX_SELECTED_PROFILES;

	const toggleProfile = (name: string) => {
		const next = new Set(selectedNames);
		if (next.has(name)) {
			next.delete(name);
		} else if (!isSelectionFull) {
			next.add(name);
		}
		setFilteredProfilesNames([...next]);
	};

	React.useEffect(() => {
		if (selectedProfileName === null) {
			return;
		}
		const index = visibleNames.indexOf(selectedProfileName);
		if (index >= renderCount) {
			setRenderCount(index + 1);
		}
		const timer = setTimeout(() => {
			document
				.getElementById(`result-item-${selectedProfileName}`)
				?.scrollIntoView({ behavior: "smooth", block: "nearest" });
		}, 50);
		return () => clearTimeout(timer);
	}, [selectedProfileName, visibleNames, renderCount]);

	const renderMessage = (message: string) => (
		<p className="px-1 py-2 text-xs text-muted-foreground">{message}</p>
	);

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
		if (error !== null) {
			return (
				<p role="alert" className="px-1 py-2 text-xs text-destructive">
					{error}
				</p>
			);
		}
		if (availableProfilesNames.length === 0) {
			return renderMessage(
				hasPattern
					? "No notebook matches this pattern."
					: "No notebooks yet. Import profiles to get started.",
			);
		}
		if (visibleNames.length === 0) {
			return renderMessage("No notebook matches your search.");
		}
		return (
			<ul className="space-y-0.5">
				{visibleNames.slice(0, renderCount).map((name) => {
					const isSelected = selectedNames.has(name);
					const isDisabled = !isSelected && isSelectionFull;
					const checkboxId = `result-cb-${name}`;
					const matchCount = matchCounts.get(name);
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
								checked={isSelected}
								disabled={isDisabled}
								onCheckedChange={() => toggleProfile(name)}
							/>
							<Label
								htmlFor={checkboxId}
								className={cn(
									"min-w-0 flex-1 truncate text-xs font-normal",
									isDisabled
										? "cursor-not-allowed text-muted-foreground"
										: "cursor-pointer",
								)}
							>
								{name}
							</Label>
							{matchCount !== undefined && (
								<span
									title={`${matchCount} ${matchCount === 1 ? "match" : "matches"}`}
									className="shrink-0 text-xs tabular-nums text-muted-foreground"
								>
									{matchCount}
								</span>
							)}
						</li>
					);
				})}
			</ul>
		);
	};

	const isReady = !isLoading && error === null;

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
				description={
					isReady && availableProfilesNames.length > 0
						? `${availableProfilesNames.length} ${hasPattern ? "matching notebooks" : "notebooks"}`
						: undefined
				}
			/>
			<Input
				type="search"
				aria-label="Search notebooks"
				placeholder="Search notebooks..."
				value={resultSearchFilter}
				onChange={(e) => setResultSearchFilter(e.target.value)}
				className="h-8"
				disabled={!isReady || availableProfilesNames.length === 0}
			/>
			<div className="flex items-center justify-between gap-2 border-b px-1 pb-2">
				<span
					className={cn(
						"text-xs tabular-nums",
						isSelectionFull ? "text-foreground" : "text-muted-foreground",
					)}
				>
					{selectedNames.size}/{MAX_SELECTED_PROFILES} selected
				</span>
				<Button
					variant="ghost"
					size="xs"
					disabled={selectedNames.size === 0}
					onClick={() => setFilteredProfilesNames([])}
				>
					Deselect all
				</Button>
			</div>
			<div
				className="min-h-0 flex-1 overflow-y-auto"
				onScroll={handleListScroll}
			>
				{renderList()}
			</div>
		</section>
	);
};

export default ProfileExplorerPpmResultsBar;
