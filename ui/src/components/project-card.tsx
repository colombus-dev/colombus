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
			className="w-full text-left bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[140px]"
		>
			<div className="flex items-start justify-between">
				<h3 className="font-semibold text-slate-900 leading-tight">
					{project.name}
				</h3>
			</div>
		</button>
	);
};
