import { ChevronRight, Folder } from "lucide-react";
import { useNavigate } from "react-router";
import { PATH } from "@/lib/constants";

interface ProjectCardProps {
	project: { id: string; name: string; description?: string | null };
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
	const navigate = useNavigate();

	return (
		<button
			type="button"
			onClick={() => navigate(`${PATH.EXPLORER}/${project.id}`)}
			className="w-full text-left bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex items-center justify-between"
		>
			<div className="flex items-center gap-3">
				<div className="p-1.5 bg-slate-100 rounded-lg">
					<Folder className="w-4 h-4 text-slate-500" />
				</div>
				<h3 className="font-semibold text-slate-700 leading-tight text-[15px]">
					{project.name}
				</h3>
			</div>
			<ChevronRight className="w-4 h-4 text-slate-300" />
		</button>
	);
};
