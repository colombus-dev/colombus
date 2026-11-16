import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProjectSearchInputProps {
	value: string;
	onChange: (value: string) => void;
}

export const ProjectSearchInput = ({
	value,
	onChange,
}: ProjectSearchInputProps) => {
	return (
		<div className="relative w-full sm:w-64">
			<Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="search"
				aria-label="Search projects"
				placeholder="Search projects..."
				className="bg-background pl-8"
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
		</div>
	);
};
