import { stepsColorsMapping } from "@/configuration";

const ProjectTaxonomyList: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	return (
		<div {...divProps}>
			<p className="font-bold">Legend</p>
			<ul className="list-none space-y-1 text-sm">
				{Object.entries(stepsColorsMapping).map(([n, c]) => (
					<li
						key={`legend_color_${c}`}
						className="flex flex-row space-y-1 space-x-1"
					>
						<div
							className="w-2"
							style={{
								backgroundColor: c,
								width: "20px",
								height: "20px",
							}}
						/>
						<div>{n}</div>
					</li>
				))}
			</ul>
		</div>
	);
};

export default ProjectTaxonomyList;
