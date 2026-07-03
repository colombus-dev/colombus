import {
	CloudDownload,
	FileJson,
	Link,
	Loader2,
	Monitor,
	Upload,
	X,
} from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { NotebookFileExtension, ProfileFileExtension } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ImportModalProps {
	onImport: (files: File[]) => Promise<void>;
	onImportKaggle?: (payload: {
		competition?: string;
		slugs?: string[];
	}) => Promise<void>;
	isImporting: boolean;
	children: React.ReactNode;
}

export default function ImportModal({
	onImport,
	onImportKaggle,
	isImporting,
	children,
}: ImportModalProps) {
	const [open, setOpen] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [dropError, setDropError] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);
	const [tab, setTab] = useState<"pc" | "kaggle">("pc");
	const [kaggleMode, setKaggleMode] = useState<"competition" | "slugs">(
		"slugs",
	);
	const [competition, setCompetition] = useState("");
	const [slugsText, setSlugsText] = useState("");

	const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
		const manuallyAccepted = fileRejections
			.map((r) => r.file)
			.filter(
				(f) =>
					f.name.toLowerCase().endsWith(NotebookFileExtension) ||
					f.name.toLowerCase().endsWith(ProfileFileExtension),
			);

		const allValidFiles = [...acceptedFiles, ...manuallyAccepted];

		if (allValidFiles.length === 0 && fileRejections.length > 0) {
			setDropError(true);
		} else {
			setDropError(false);
			setSelectedFiles((prev) => {
				// Prevent duplicates
				const newFiles = allValidFiles.filter(
					(newFile) => !prev.some((existing) => existing.name === newFile.name),
				);
				return [...prev, ...newFiles];
			});
		}
		setServerError(null);
	}, []);

	const onDropRejected = useCallback((fileRejections: any[]) => {
		const hasValidExtension = fileRejections.some(
			(r) =>
				r.file.name.toLowerCase().endsWith(NotebookFileExtension) ||
				r.file.name.toLowerCase().endsWith(ProfileFileExtension),
		);
		if (!hasValidExtension) {
			setDropError(true);
		}
	}, []);

	const onDragEnter = useCallback(() => {
		setDropError(false);
		setServerError(null);
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		onDropRejected,
		onDragEnter,
		accept: {
			"application/json": [NotebookFileExtension, ProfileFileExtension],
			"application/x-ipynb+json": [NotebookFileExtension],
			"text/plain": [NotebookFileExtension, ProfileFileExtension],
			"*/*": [NotebookFileExtension, ProfileFileExtension],
		},
	});

	const handleRemoveFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleImportClick = async () => {
		if (selectedFiles.length === 0) return;
		try {
			await onImport(selectedFiles);
			setOpen(false);
			setSelectedFiles([]);
			setServerError(null);
		} catch (error: any) {
			setServerError(error.message);
		}
	};

	const handleKaggleImportClick = async () => {
		if (!onImportKaggle) return;

		try {
			if (kaggleMode === "competition") {
				if (!competition) return;
				await onImportKaggle({ competition });
			} else {
				const slugs = slugsText
					.split("\n")
					.map((s) => s.trim())
					.map((s) => {
						const match = s.match(/kaggle\.com\/code\/([^/]+\/[^/?#]+)/);
						return match ? match[1] : s;
					})
					.filter((s) => s.length > 0);
				if (slugs.length === 0) return;
				await onImportKaggle({ slugs });
			}
			setOpen(false);
			setCompetition("");
			setSlugsText("");
			setServerError(null);
		} catch (error: any) {
			setServerError(error.message);
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!isImporting) {
			setOpen(newOpen);
			if (!newOpen) {
				setSelectedFiles([]);
				setDropError(false);
				setServerError(null);
				setCompetition("");
				setSlugsText("");
			}
		}
	};

	const parsedSlugs = slugsText
		.split("\n")
		.map((s) => s.trim())
		.filter((s) => s.length > 0);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-[90vw] w-full max-h-[90vh] h-[90vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>Import Notebooks & Profiles</DialogTitle>
					<DialogDescription>
						Drag and drop your JSON files here, or click to browse.
					</DialogDescription>
				</DialogHeader>

				{isImporting ? (
					<div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
						<Loader2 className="w-12 h-12 text-slate-400 animate-spin mb-4" />
						<p className="text-lg font-medium text-slate-600 dark:text-slate-300">
							Importing your files...
						</p>
					</div>
				) : (
					<div className="flex-1 flex flex-col min-h-0">
						{onImportKaggle && (
							<div className="flex p-1 space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4 shrink-0">
								<button
									type="button"
									onClick={() => setTab("pc")}
									className={`flex-1 flex items-center justify-center py-2 px-3 text-sm font-medium rounded-md transition-all ${
										tab === "pc"
											? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
											: "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
									}`}
								>
									<Monitor className="w-4 h-4 mr-2" />
									From My PC
								</button>
								<button
									type="button"
									onClick={() => setTab("kaggle")}
									className={`flex-1 flex items-center justify-center py-2 px-3 text-sm font-medium rounded-md transition-all ${
										tab === "kaggle"
											? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
											: "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
									}`}
								>
									<CloudDownload className="w-4 h-4 mr-2" />
									Kaggle
								</button>
							</div>
						)}

						{tab === "pc" ? (
							<>
								<div
									{...getRootProps()}
									className={`flex-1 min-h-[250px] border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${
										isDragActive
											? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
											: (dropError || serverError)
												? "border-red-500 bg-red-50/50 dark:border-red-500/50 dark:bg-red-900/20"
												: "border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
									}`}
								>
									<input {...getInputProps()} />
									<div
										className={`p-4 rounded-full shadow-sm mb-4 ${dropError || serverError ? "bg-red-100 dark:bg-red-950/50" : "bg-white dark:bg-slate-950"}`}
									>
										<Upload
											className={`w-8 h-8 ${dropError || serverError ? "text-red-500" : "text-slate-500"}`}
										/>
									</div>
									<p
										className={`text-sm font-medium mb-1 ${dropError || serverError ? "text-red-500" : "text-slate-900 dark:text-slate-100"}`}
									>
										{isDragActive
											? "Drop files here..."
											: dropError
												? "Invalid file format."
												: serverError
													? serverError
													: "Click or drag files to upload"}
									</p>
									<p
										className={`text-xs ${dropError || serverError ? "text-red-500/80" : "text-slate-500"}`}
									>
										Supported formats: {NotebookFileExtension},{" "}
										{ProfileFileExtension}
									</p>
								</div>

								{selectedFiles.length > 0 && (
									<div className="mt-6 space-y-2 max-h-48 overflow-y-auto pr-2 shrink-0">
										<h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
											Selected Files ({selectedFiles.length})
										</h4>
										{selectedFiles.map((file, index) => (
											<div
												key={`${file.name}-${index}`}
												className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg shadow-sm"
											>
												<div className="flex items-center space-x-3 overflow-hidden">
													<div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md shrink-0">
														<FileJson className="w-4 h-4 text-blue-600 dark:text-blue-400" />
													</div>
													<span className="text-sm font-medium truncate text-slate-700 dark:text-slate-300">
														{file.name}
													</span>
												</div>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														handleRemoveFile(index);
													}}
													className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
													title="Remove file"
												>
													<X className="w-4 h-4" />
												</button>
											</div>
										))}
									</div>
								)}

								<div className="mt-auto pt-6 flex justify-end space-x-3 shrink-0">
									<Button
										variant="outline"
										onClick={() => handleOpenChange(false)}
										disabled={isImporting}
									>
										Cancel
									</Button>
									<Button
										onClick={handleImportClick}
										disabled={selectedFiles.length === 0 || isImporting}
										className="bg-slate-900 hover:bg-slate-800 text-white"
									>
										Import Files
									</Button>
								</div>
							</>
						) : (
							<div className="flex-1 flex flex-col mt-4 min-h-[250px]">
								{/* Sub-tabs for Competition vs Slugs */}
								<div className="flex space-x-2 mb-4 shrink-0">
									<button
										type="button"
										onClick={() => {
											setKaggleMode("slugs");
											setServerError(null);
										}}
										className={`flex items-center py-1.5 px-3 text-xs font-medium rounded-full transition-all ${
											kaggleMode === "slugs"
												? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
												: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
										}`}
									>
										<Link className="w-3 h-3 mr-1.5" />
										Notebook Slugs
									</button>
									<button
										type="button"
										onClick={() => {
											setKaggleMode("competition");
											setServerError(null);
										}}
										className={`flex items-center py-1.5 px-3 text-xs font-medium rounded-full transition-all ${
											kaggleMode === "competition"
												? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
												: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
										}`}
									>
										<CloudDownload className="w-3 h-3 mr-1.5" />
										Competition Name
									</button>
								</div>

								<div className="flex-1">
									{kaggleMode === "competition" ? (
										<>
											<label
												htmlFor="competition-name"
												className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
											>
												Competition Name
											</label>
											<Input
												id="competition-name"
												placeholder="e.g. titanic, playground-series-s6e7"
												value={competition}
												onChange={(e) => setCompetition(e.target.value)}
												className="w-full"
											/>
											<p className="mt-2 text-xs text-slate-500">
												Enter the exact slug of the Kaggle competition (found in
												the competition URL). Requires a verified Kaggle
												account.
											</p>
										</>
									) : (
										<>
											<label
												htmlFor="notebook-slugs"
												className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
											>
												Notebook Slugs{" "}
												{parsedSlugs.length > 0 && (
													<span className="text-slate-400 font-normal">
														({parsedSlugs.length} notebook
														{parsedSlugs.length > 1 ? "s" : ""})
													</span>
												)}
											</label>
											<textarea
												id="notebook-slugs"
												placeholder={`Paste one slug per line, e.g.:\nalexisbcook/titanic-tutorial\nstartupsci/titanic-data-science-solutions\ngunesevitan/titanic-advanced-feature-engineering`}
												value={slugsText}
												onChange={(e) => setSlugsText(e.target.value)}
												className="w-full h-40 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none font-mono"
											/>
											<p className="mt-2 text-xs text-slate-500">
												Go to the competition&apos;s <strong>Code</strong> tab
												on Kaggle, click on a notebook, and copy the{" "}
												<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">
													username/notebook-name
												</code>{" "}
												from the URL. Works sans phone verification.
											</p>
										</>
									)}
									{serverError && (
										<p className="mt-4 text-sm font-medium text-red-500 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-900/50">
											{serverError}
										</p>
									)}
								</div>

								<div className="mt-auto pt-6 flex justify-end space-x-3 shrink-0">
									<Button
										variant="outline"
										onClick={() => handleOpenChange(false)}
										disabled={isImporting}
									>
										Cancel
									</Button>
									<Button
										onClick={handleKaggleImportClick}
										disabled={
											(kaggleMode === "competition"
												? !competition
												: parsedSlugs.length === 0) || isImporting
										}
										className="bg-slate-900 hover:bg-slate-800 text-white"
									>
										Import from Kaggle
									</Button>
								</div>
							</div>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
