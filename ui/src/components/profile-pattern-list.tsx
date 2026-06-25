import Editor, { useMonaco } from "@monaco-editor/react";
import { Trash } from "lucide-react";
import { useEffect } from "react";
import { useParams } from "react-router";
import { getAllPatterns } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import useCanopusGrammar from "@/hooks/editor/useCanopusGrammar";
import useCanopusTheme from "@/hooks/editor/useCanopusTheme";
import { EDITOR_LANGUAGE_ID } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useColombusStore } from "@/store";
import DeletePatternDialog from "./delete-pattern-dialog";

const ProfilePatternList: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const setCurrentPattern = useColombusStore(
		(state) => state.setCurrentPattern,
	);
	const availablePatterns = useColombusStore((state) => state.allSavedPatterns);
	const setAvailablePatterns = useColombusStore(
		(state) => state.setAllSavedPatterns,
	);
	const { projectId } = useParams<{ projectId: string }>();

	const monaco = useMonaco();
	const { themeName } = useCanopusTheme(monaco);
	useCanopusGrammar(monaco);

	useEffect(() => {
		if (!projectId) {
			return;
		}
		getAllPatterns(projectId).then(setAvailablePatterns);
	}, [setAvailablePatterns, projectId]);

	return (
		<div {...divProps} className={cn("space-x-1", divProps.className)}>
			<TooltipProvider>
				<ul className="list-none space-y-1">
					{availablePatterns.map(({ name, groups, dsl_content }) => {
						const lineCount = (dsl_content || "").split("\n").length;
						const editorHeight = Math.min(
							Math.max(lineCount * 19 + 20, 100),
							600,
						);

						return (
							<li key={name} className="grid grid-cols-6 space-x-1">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											className="col-span-5 truncate justify-start"
											key={name}
											onClick={() => {
												setCurrentPattern({
													name,
													groups,
													dsl_content,
												});
											}}
										>
											{name}
										</Button>
									</TooltipTrigger>
									<TooltipContent
										side="right"
										className="bg-white text-slate-900 border border-slate-200 shadow-md p-1 z-[100]"
									>
										<div
											className="w-[500px] relative"
											style={{ height: `${editorHeight}px` }}
										>
											{themeName && (
												<Editor
													theme={themeName}
													defaultLanguage={EDITOR_LANGUAGE_ID}
													value={dsl_content}
													options={{
														readOnly: true,
														minimap: { enabled: false },
														lineNumbers: "on",
														scrollBeyondLastLine: false,
														wordWrap: "on",
														overviewRulerLanes: 0,
														hideCursorInOverviewRuler: true,
														automaticLayout: true,
														scrollbar: {
															vertical: "auto",
															horizontal: "hidden",
														},
														folding: false,
														renderLineHighlight: "none",
														contextmenu: false,
													}}
												/>
											)}
										</div>
									</TooltipContent>
								</Tooltip>
								<DeletePatternDialog patternName={name}>
									<Button key={`delete-${name}`} className="col-span-1">
										<Trash />
									</Button>
								</DeletePatternDialog>
							</li>
						);
					})}
					{availablePatterns.length === 0 && (
						<p className="text-sm text-slate-500">
							Saved patterns will be listed here...
						</p>
					)}
				</ul>
			</TooltipProvider>
		</div>
	);
};

export default ProfilePatternList;
