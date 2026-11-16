import { SectionHeading } from "@/components/section-heading";
import { stepsColorsMapping } from "@/configuration";
import { cn } from "@/lib/utils";

const ProjectTaxonomyList: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ className, ...props }) => {
	return (
		<div {...props} className={cn("space-y-2", className)}>
			<SectionHeading title="Legend" />
			<ul className="flex flex-col space-y-2.5">
				{Object.entries(stepsColorsMapping).map(([name, color]) => (
					<li
						key={name}
						className="flex items-center gap-3 text-sm leading-none font-medium"
					>
						<span
							aria-hidden="true"
							className="size-4 shrink-0 rounded-full"
							style={{ backgroundColor: color }}
						/>
						<span className="truncate">{name}</span>
					</li>
				))}
			</ul>
		</div>
	);
};

export default ProjectTaxonomyList;
