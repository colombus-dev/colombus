import React, { useMemo, useState } from "react";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
	const availableProfileIds = useColombusStore(
		(state) => state.availableProfileIds,
	);
	const availableProfilesWithPpmData = useColombusStore(
		(state) => state.availableProfilesWithPpmData,
	);
	const filteredProfileIds = useColombusStore(
		(state) => state.filteredProfileIds,
	);
	const setFilteredProfileIds = useColombusStore(
		(state) => state.setFilteredProfileIds,
	);
	const selectedProfileId = useColombusStore(
		(state) => state.selectedProfileId,
	);
	const profilesNames = useColombusStore((state) => state.profilesNames);

	const selectedIds = useMemo(() => {
		const available = new Set(availableProfileIds);
		return new Set(filteredProfileIds.filter((id) => available.has(id)));
	}, [availableProfileIds, filteredProfileIds]);

	const matchCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const { profile_id } of availableProfilesWithPpmData) {
			counts.set(profile_id, (counts.get(profile_id) ?? 0) + 1);
		}
		return counts;
	}, [availableProfilesWithPpmData]);

	const visibleIds = useMemo(() => {
		const query = resultSearchFilter.trim().toLowerCase();
		return query === ""
			? availableProfileIds
			: availableProfileIds.filter((id) =>
					(profilesNames[id] ?? "").toLowerCase().includes(query),
				);
	}, [availableProfileIds, profilesNames, resultSearchFilter]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset the rendered chunk when the list changes
	React.useEffect(() => {
		setRenderCount(RENDER_CHUNK_SIZE);
	}, [visibleIds]);

	const handleListScroll = (event: React.UIEvent<HTMLDivElement>) => {
		const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
		if (
			renderCount < visibleIds.length &&
			scrollTop + clientHeight >= scrollHeight - LOAD_MORE_THRESHOLD_PX
		) {
			setRenderCount((count) => count + RENDER_CHUNK_SIZE);
		}
	};

	const toggleProfile = (id: string) => {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		setFilteredProfileIds([...next]);
	};

	React.useEffect(() => {
		if (selectedProfileId === null) {
			return;
		}
		const index = visibleIds.indexOf(selectedProfileId);
		if (index >= renderCount) {
			setRenderCount(index + 1);
		}
		const timer = setTimeout(() => {
			document
				.getElementById(`result-item-${selectedProfileId}`)
				?.scrollIntoView({ behavior: "smooth", block: "nearest" });
		}, 50);
		return () => clearTimeout(timer);
	}, [selectedProfileId, visibleIds, renderCount]);

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
		if (availableProfileIds.length === 0) {
			return renderMessage(
				hasPattern
					? "No notebook matches this pattern."
					: "No notebooks yet. Import profiles to get started.",
			);
		}
		if (visibleIds.length === 0) {
			return renderMessage("No notebook matches your search.");
		}
		return (
			<ul className="space-y-0.5">
				{visibleIds.slice(0, renderCount).map((id) => {
					const isSelected = selectedIds.has(id);
					const checkboxId = `result-cb-${id}`;
					const matchCount = matchCounts.get(id);
					return (
						<li
							key={id}
							id={`result-item-${id}`}
							className={cn(
								"flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-muted",
								id === selectedProfileId && "bg-muted",
							)}
						>
							<Checkbox
								id={checkboxId}
								checked={isSelected}
								onCheckedChange={() => toggleProfile(id)}
							/>
							<Label
								htmlFor={checkboxId}
								className="min-w-0 flex-1 cursor-pointer truncate text-xs font-normal"
							>
								{profilesNames[id] ?? id}
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
					isReady && availableProfileIds.length > 0
						? `${availableProfileIds.length} ${hasPattern ? "matching notebooks" : "notebooks"}`
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
				disabled={!isReady || availableProfileIds.length === 0}
			/>
			<div className="flex items-center justify-between gap-2 border-b px-1 pb-2">
				<span className="text-xs tabular-nums text-muted-foreground">
					{selectedIds.size} selected
				</span>
				<Button
					variant="ghost"
					size="xs"
					disabled={selectedIds.size === 0}
					onClick={() => setFilteredProfileIds([])}
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
