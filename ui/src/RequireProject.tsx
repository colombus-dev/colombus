import ProjectCreateForm from "@/components/project-create-form";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { postRetrieveProjectName } from "./api/client";
import { useColombusStore } from "./store";
import ProjectApiKeyForm from "./components/project-apikey-form";

export default function RequireProject({
	children,
}: React.PropsWithChildren): JSX.Element {
	const apiKey = useColombusStore((state) => state.apiKey);
	const currentProject = useColombusStore((state) => state.currentProject);
	const setCurrentProject = useColombusStore(
		(state) => state.setCurrentProject,
	);
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const projectId = searchParams.get("project");

	useEffect(() => {
		if (!apiKey) {
			return;
		}
		if (!projectId) {
			if (currentProject) {
				navigate(`/explorer?project=${currentProject.id}`);
			}
			return;
		}
		postRetrieveProjectName(projectId, apiKey).then((name) => {
			if (currentProject?.name !== name) {
				setCurrentProject({
					id: projectId,
					name,
				});
			}
		});
	}, [apiKey, projectId, currentProject, setCurrentProject, navigate]);

	if (!apiKey) {
		return (
			<section className="grid grid-cols-3 grid-rows-5 space-x-4 h-full">
				<ProjectApiKeyForm className="col-start-2 col-span-1 row-start-2 row-span-1" />
			</section>
		);
	}
	return currentProject ? (
		<>{children}</>
	) : (
		<section className="grid grid-cols-3 grid-rows-5 space-x-4 h-full">
			<ProjectCreateForm className="col-start-2 col-span-1 row-start-2 row-span-1" />
		</section>
	);
}
