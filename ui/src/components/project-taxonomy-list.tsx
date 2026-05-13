import { useMemo } from "react";
import { getStepColor, supportedSteps } from "@/configuration";

function pickColor(stepName: string | undefined) {
	return getStepColor(stepName);
}

function normalizeStepNames(stepNames: string[] | undefined) {
	const uniqueStepNames = [...new Set(stepNames ?? [])];
	return uniqueStepNames.sort((left, right) => {
		const leftIndex = supportedSteps.indexOf(left);
		const rightIndex = supportedSteps.indexOf(right);

		if (leftIndex === -1 && rightIndex === -1) {
			return left.localeCompare(right);
		}
		if (leftIndex === -1) return 1;
		if (rightIndex === -1) return -1;

		return leftIndex - rightIndex;
	});
}

export interface ProjectTaxonomyListProps {
	stepNames?: string[];
}

const ProjectTaxonomyList: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement> & ProjectTaxonomyListProps
	> = ({ stepNames, ...divProps }) => {
	const legendItems = useMemo(() => {
		return normalizeStepNames(stepNames).map((stepName, index) => ({
			label: stepName,
			color: pickColor(stepName),
			index,
		}));
	}, [stepNames]);

	return (
		<div {...divProps}>
			<div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
				Légende
			</div>
			{legendItems.length === 0 ? (
				<div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-400">
					Aucun arbre visible
				</div>
			) : null}
			<ul className="grid grid-cols-1 gap-1 list-none text-sm">
				{legendItems.map(({ label, color, index }) => (
					<li
						key={`legend_color_${label}_${index}`}
						className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1"
					>
						<div
							className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-slate-200/60"
							style={{ backgroundColor: color }}
						/>
						<div className="min-w-0 flex-1 text-[10px] leading-tight text-slate-600">
							<span className="block truncate font-medium" title={label}>{label}</span>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
};

export default ProjectTaxonomyList;
