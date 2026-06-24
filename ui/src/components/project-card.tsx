import { useNavigate } from "react-router";
import { PATH } from "@/lib/constants";

interface ProjectCardProps {
	project: { id: string; name: string };
	isActive?: boolean;
}

export const ProjectCard = ({ project, isActive }: ProjectCardProps) => {
	const navigate = useNavigate();

	return (
		<button
			type="button"
			onClick={() => navigate(`${PATH.EXPLORER}/${project.id}`)}
			className="w-full text-left bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[140px]"
		>
			<div className="flex items-start justify-between">
				<h3 className="font-semibold text-slate-900 leading-tight">
					{project.name}
				</h3>
				{isActive && (
					<span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
						Active
					</span>
				)}
			</div>
			<div className="space-y-1 mt-4">
				<p className="text-xs text-slate-400">main</p>
				<p className="text-xs text-slate-500 line-clamp-1">
					Project configuration
				</p>
			</div>
		</button>
	);
};
