import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import { useState } from "react";

let beforeAllChecked: string[] = [];

const ProfileExplorerPpmResultsBar: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const [resultSearchFilter, setResultSearchFilter] = useState<string>("");
	const availableProfilesNames = useColombusStore(
		(state) => state.availableProfilesNames,
	);
	const filteredProfilesNames = useColombusStore(
		(state) => state.filteredProfilesNames,
	);
	const setFilteredProfilesNames = useColombusStore(
		(state) => state.setFilteredProfilesNames,
	);
	return (
		<div {...divProps} className={cn("space-y-2", divProps.className)}>
			<p className="font-bold">
				Results: {availableProfilesNames.length} matches
			</p>
			<Input
				id="filter-results"
				type="text"
				placeholder="Filter results"
				onChange={(e) => setResultSearchFilter(e.target.value.toLowerCase())}
			/>
			<div className="flex space-x-2" key="check-all-div">
				<Checkbox
					id="check-all"
					checked={
						filteredProfilesNames?.length === availableProfilesNames.length
					}
					onCheckedChange={(c) => {
						if (c) {
							beforeAllChecked = filteredProfilesNames;
							setFilteredProfilesNames(availableProfilesNames);
						} else {
							setFilteredProfilesNames(beforeAllChecked);
						}
					}}
				/>
				<div className="grid gap-1.5 leading-none">
					<label htmlFor="check-all" className="text-sm font-medium italic">
						Check all
					</label>
				</div>
			</div>
			<ScrollArea className="h-[45vh]">
				<div className="space-y-1">
					{availableProfilesNames
						.filter((w) => w.toLowerCase().includes(resultSearchFilter))
						.map((w) => (
							<div className="flex space-x-2" key={w}>
								<Checkbox
									id={`cb_${w}`}
									checked={filteredProfilesNames?.includes(w)}
									onCheckedChange={(c) => {
										if (!filteredProfilesNames) {
											return;
										}
										setFilteredProfilesNames(
											c
												? [...filteredProfilesNames, w]
												: filteredProfilesNames.filter((fw) => fw !== w),
										);
									}}
								/>
								<div className="grid gap-1.5 leading-none">
									<label
										htmlFor={`cb_${w}`}
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										{w}
									</label>
								</div>
							</div>
						))}
				</div>
				<ScrollBar />
			</ScrollArea>
		</div>
	);
};

export default ProfileExplorerPpmResultsBar;
