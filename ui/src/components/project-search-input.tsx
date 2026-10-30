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
			<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
			<Input
				placeholder="Search projects..."
				className="pl-9 bg-white border-slate-200 rounded-xl h-10"
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
		</div>
	);
};
