import { stepsColorsMapping } from "@/configuration";

interface ProjectTaxonomyListProps extends React.HTMLAttributes<HTMLDivElement> {
	colorSize?: string;
}

const ProjectTaxonomyList: React.FunctionComponent<ProjectTaxonomyListProps> = ({
	colorSize = "w-5 h-5",
	...divProps
}) => {
	return (
		<div
			{...divProps}
			className={`border border-[#e2e8f0] rounded-[20px] p-4 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] ${divProps.className ?? ""}`}
		>
			<p className="text-[14px] font-bold tracking-widest text-[#000000] uppercase mb-3 px-1">
				Légende
			</p>
			<ul className="flex flex-col items-start gap-1.5 list-none">
				{Object.entries(stepsColorsMapping).map(([n, c]) => (
					<li
						key={`legend_color_${c}`}
						className="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs font-medium text-[#475569] transition-all hover:bg-slate-50"
					>
						<div
							className={`${colorSize} rounded-full shrink-0`}
							style={{
								backgroundColor: c,
							}}
						/>
						<span className="truncate">{n}</span>
					</li>
				))}
			</ul>
		</div>
	);
};

export default ProjectTaxonomyList;
