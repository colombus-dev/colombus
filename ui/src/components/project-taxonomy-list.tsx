import { stepsColorsMapping } from "@/configuration";

interface ProjectTaxonomyListProps
	extends React.HTMLAttributes<HTMLDivElement> {
	colorSize?: string;
}

const ProjectTaxonomyList: React.FunctionComponent<
	ProjectTaxonomyListProps
> = ({ colorSize = "w-3.5 h-3.5", ...divProps }) => {
	return (
		<div
			{...divProps}
			className={`border border-[#e2e8f0] rounded-[20px] p-3 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col ${divProps.className ?? ""}`}
		>
			<p className="font-bold">Legend</p>
			<ul className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 list-none pr-1">
				{Object.entries(stepsColorsMapping).map(([n, c]) => (
					<li
						key={`legend_color_${c}`}
						className="flex items-center gap-2 px-1 py-1 text-xs font-medium text-[#475569] transition-all w-full shrink-0"
					>
						<div
							className={`${colorSize} rounded-full shrink-0`}
							style={{
								backgroundColor: c,
							}}
						/>
						<span className="truncate" title={n}>
							{n}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
};

export default ProjectTaxonomyList;
