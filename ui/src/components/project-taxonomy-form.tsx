import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ProjectTaxonomyForm: React.FunctionComponent<
	React.HTMLAttributes<HTMLDivElement>
> = ({ ...divProps }) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleProfileFormSubmit = useCallback(async (_formData: FormData) => {
		// TODO
	}, []);

	return (
		<div {...divProps}>
			<form action={handleProfileFormSubmit}>
				<div className="grid w-full max-w-sm items-center gap-1.5">
					<Label htmlFor="profile-form">Change the taxonomy</Label>
					<input
						id="taxonomy-form"
						name="taxonomy-form"
						type="file"
						accept=".json"
						required
						className="hidden"
						onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
						ref={fileInputRef}
					/>
					<div className="flex items-center gap-2 border border-input rounded-md px-3 py-1 text-sm bg-transparent shadow-sm">
						<Button
							type="button"
							variant="secondary"
							className="h-7 px-2.5 text-xs shrink-0"
							onClick={() => fileInputRef.current?.click()}
						>
							Choose file
						</Button>
						<span className="text-muted-foreground text-xs truncate flex-1 text-left">
							{selectedFile ? selectedFile.name : "No file chosen"}
						</span>
					</div>
					<Button
						type="submit"
						disabled={!selectedFile}
						className={
							selectedFile
								? ""
								: "bg-slate-100 text-slate-400 hover:bg-slate-100"
						}
					>
						Submit Taxonomy (list of strings)
					</Button>
				</div>
			</form>
		</div>
	);
};

export default ProjectTaxonomyForm;
