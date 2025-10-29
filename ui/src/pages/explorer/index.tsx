import ProjectCreateForm from "@/components/project-create-form";
import ProjectSearchForm from "@/components/project-search-form";

export default function ExplorerPage() {
	return (
		<section className="grid grid-cols-4 grid-rows-5 space-x-4 h-full">
			<ProjectCreateForm className="col-start-2 col-span-1 row-start-2 row-span-1" />
			<ProjectSearchForm className="col-start-3 col-span-1 row-start-2 row-span-1" />
		</section>
	);
}
