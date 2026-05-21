import { stepsColorsMapping } from "@/configuration";
import { cn } from "@/lib/utils";

const ProjectTaxonomyList: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	return (
		<div {...divProps} className={cn("space-y-2.5", divProps.className)}>
			<h3 className="text-sm font-bold text-slate-800">LÉGENDE</h3>
			<div className="flex flex-wrap gap-1.5">
				{Object.entries(stepsColorsMapping).map(([n, c]) => (
					<div
						key={`legend_color_${c}`}
						className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-sm"
					>
						<span
							className="w-2 h-2 rounded-full shrink-0"
							style={{ backgroundColor: c }}
						/>
						<span>{n}</span>
					</div>
				))}
			</div>
		</div>
	);
};

export default ProjectTaxonomyList;
