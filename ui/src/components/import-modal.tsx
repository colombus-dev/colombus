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
import { NotebookFileExtension } from "@/api/client";
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
		scores?: Record<string, number>;
	}) => Promise<void>;
	onSearchKaggle?: (
		competition: string,
	) => Promise<
		{ ref: string; title: string; author: string; score?: number | null }[]
	>;
	onSearchKaggleCompetitions?: (
		search: string,
	) => Promise<{ ref: string; title: string; description: string }[]>;
	isImporting: boolean;
	children: React.ReactNode;
}

export default function ImportModal({
	onImport,
	onImportKaggle,
	onSearchKaggle,
	onSearchKaggleCompetitions,
	isImporting,
	children,
}: ImportModalProps) {
	const [open, setOpen] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [dropError, setDropError] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);
	const [tab, setTab] = useState<"pc" | "kaggle">("pc");
	const [competition, setCompetition] = useState("");
	const [searchedCompetitions, setSearchedCompetitions] = useState<
		{ ref: string; title: string; description: string }[] | null
	>(null);
	const [selectedCompetition, setSelectedCompetition] = useState<{
		ref: string;
		title: string;
	} | null>(null);
	const [searchedNotebooks, setSearchedNotebooks] = useState<
		| { ref: string; title: string; author: string; score?: number | null }[]
		| null
	>(null);
	const [selectedNotebookSlugs, setSelectedNotebookSlugs] = useState<string[]>(
		[],
	);
	const [isSearching, setIsSearching] = useState(false);

	const handleSearchCompetitionsClick = () => {
		if (!onSearchKaggleCompetitions || !competition) return;
		setIsSearching(true);
		setServerError(null);
		setSearchedNotebooks(null);
		setSelectedCompetition(null);

		const compSlug = competition.match(/kaggle\.com\/competitions\/([^/?#]+)/);
		const finalComp = compSlug ? compSlug[1] : competition.trim();

		onSearchKaggleCompetitions(finalComp)
			.then((results) => {
				setSearchedCompetitions(results);
				if (results.length === 0) {
					setServerError("No competitions found matching your search.");
				}
			})
			.catch((error: any) => {
				setServerError(error.message);
			})
			.finally(() => {
				setIsSearching(false);
			});
	};

	const handleSelectCompetition = (comp: { ref: string; title: string }) => {
		if (!onSearchKaggle) return;
		setSelectedCompetition(comp);
		setSearchedCompetitions(null);
		setIsSearching(true);
		setServerError(null);

		onSearchKaggle(comp.ref)
			.then((notebooks) => {
				setSearchedNotebooks(notebooks);
				setSelectedNotebookSlugs([]);
			})
			.catch((error: any) => {
				setServerError(error.message);
			})
			.finally(() => {
				setIsSearching(false);
			});
	};

	const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
		const manuallyAccepted = fileRejections
			.map((r) => r.file)
			.filter((f) => f.name.toLowerCase().endsWith(NotebookFileExtension));

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
		const hasValidExtension = fileRejections.some((r) =>
			r.file.name.toLowerCase().endsWith(NotebookFileExtension),
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
			"application/json": [NotebookFileExtension],
			"application/x-ipynb+json": [NotebookFileExtension],
			"text/plain": [NotebookFileExtension],
			"*/*": [NotebookFileExtension],
		},
	});

	const handleRemoveFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleImportClick = () => {
		if (selectedFiles.length === 0) return;
		onImport(selectedFiles)
			.then(() => {
				setOpen(false);
				setSelectedFiles([]);
				setServerError(null);
			})
			.catch((error: any) => {
				setServerError(error.message);
			});
	};

	const handleKaggleImportClick = () => {
		if (!onImportKaggle) return;

		let importPromise: Promise<void>;

		if (searchedNotebooks) {
			if (selectedNotebookSlugs.length === 0) return;
			const scoresToSubmit = Object.fromEntries(
				searchedNotebooks
					.filter(
						(nb) =>
							selectedNotebookSlugs.includes(nb.ref) &&
							nb.score !== undefined &&
							nb.score !== null,
					)
					.map((nb) => [nb.ref, nb.score as number]),
			);
			importPromise = onImportKaggle({
				slugs: selectedNotebookSlugs,
				scores: scoresToSubmit,
			});
		} else {
			const targetComp = selectedCompetition
				? selectedCompetition.ref
				: competition;
			if (!targetComp) return;
			const compSlug = targetComp.match(/kaggle\.com\/competitions\/([^/?#]+)/);
			const finalComp = compSlug ? compSlug[1] : targetComp.trim();
			importPromise = onImportKaggle({ competition: finalComp });
		}

		importPromise
			.then(() => {
				setOpen(false);
				setCompetition("");
				setSearchedNotebooks(null);
				setSearchedCompetitions(null);
				setSelectedCompetition(null);
				setServerError(null);
			})
			.catch((error: any) => {
				setServerError(error.message);
			});
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!isImporting) {
			setOpen(newOpen);
			if (!newOpen) {
				setSelectedFiles([]);
				setDropError(false);
				setServerError(null);
				setCompetition("");
				setSearchedNotebooks(null);
				setSearchedCompetitions(null);
				setSelectedCompetition(null);
				setSelectedNotebookSlugs([]);
			}
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-[90vw] w-full max-h-[90vh] h-[90vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>Import Notebooks</DialogTitle>
					<DialogDescription>
						Drag and drop your JSON files here, or click to browse.
					</DialogDescription>
				</DialogHeader>

				{isImporting ? (
					<div className="flex-1 flex flex-col items-center justify-center min-h-[300px] px-8">
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
										Supported formats: {NotebookFileExtension}
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
								<div className="flex-1">
									<label
										htmlFor="competition-name"
										className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
									>
										Competition Name
									</label>
									<div className="flex space-x-2">
										<Input
											id="competition-name"
											placeholder="e.g. titanic, playground-series-s6e7"
											value={competition}
											onChange={(e) => {
												setCompetition(e.target.value);
												setSearchedCompetitions(null);
												setSearchedNotebooks(null);
												setSelectedCompetition(null);
												setSelectedNotebookSlugs([]);
											}}
											className="w-full"
										/>
										{onSearchKaggleCompetitions && (
											<Button
												onClick={handleSearchCompetitionsClick}
												disabled={!competition || isSearching}
												variant="outline"
											>
												{isSearching ? (
													<Loader2 className="w-4 h-4 animate-spin" />
												) : (
													"Search"
												)}
											</Button>
										)}
									</div>
									<p className="mt-2 text-xs text-slate-500">
										Enter the exact slug of the Kaggle competition (found in the
										competition URL). Requires a verified Kaggle account.
									</p>

									{searchedCompetitions && !selectedCompetition && (
										<div className="mt-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 max-h-48 overflow-y-auto">
											<div className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex justify-between items-center">
												<p className="text-xs font-medium text-slate-600 dark:text-slate-400">
													Found {searchedCompetitions.length} competitions
												</p>
											</div>
											<div className="divide-y divide-slate-100 dark:divide-slate-800">
												{searchedCompetitions.map((comp) => (
													<button
														key={comp.ref}
														type="button"
														onClick={() => handleSelectCompetition(comp)}
														className="w-full text-left block px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
													>
														<p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
															{comp.title}
														</p>
														<p className="text-xs text-slate-500 truncate mt-0.5">
															{comp.description} &bull;{" "}
															<span className="font-mono">{comp.ref}</span>
														</p>
													</button>
												))}
											</div>
										</div>
									)}

									{selectedCompetition && (
										<div className="mt-4">
											<div className="flex justify-between items-center mb-2">
												<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
													Selected:{" "}
													<span className="font-bold">
														{selectedCompetition.title}
													</span>
												</p>
												<button
													type="button"
													onClick={() => {
														setSelectedCompetition(null);
														setSearchedNotebooks(null);
														setSelectedNotebookSlugs([]);
													}}
													className="text-xs text-blue-600 hover:underline"
												>
													Change
												</button>
											</div>
										</div>
									)}

									{searchedNotebooks && (
										<div
											className="mt-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 flex flex-col min-h-0"
											style={{ maxHeight: "400px" }}
										>
											<div className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex justify-between items-center z-10 shrink-0">
												<p className="text-xs font-medium text-slate-600 dark:text-slate-400">
													Found {searchedNotebooks.length} notebooks
												</p>
												<label className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
													<input
														type="checkbox"
														className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
														checked={
															searchedNotebooks.length > 0 &&
															selectedNotebookSlugs.length ===
																searchedNotebooks.length
														}
														onChange={(e) => {
															if (e.target.checked) {
																setSelectedNotebookSlugs(
																	searchedNotebooks.map((nb) => nb.ref),
																);
															} else {
																setSelectedNotebookSlugs([]);
															}
														}}
													/>
													<span>Select All</span>
												</label>
											</div>
											<div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
												{searchedNotebooks.map((nb) => (
													<label
														key={nb.ref}
														className="flex items-start px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group cursor-pointer"
													>
														<div className="mt-0.5 mr-3 shrink-0">
															<input
																type="checkbox"
																className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
																checked={selectedNotebookSlugs.includes(nb.ref)}
																onChange={(e) => {
																	if (e.target.checked) {
																		setSelectedNotebookSlugs((prev) => [
																			...prev,
																			nb.ref,
																		]);
																	} else {
																		setSelectedNotebookSlugs((prev) =>
																			prev.filter((slug) => slug !== nb.ref),
																		);
																	}
																}}
															/>
														</div>
														<div className="min-w-0 flex-1">
															<div className="flex items-center">
																<p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
																	{nb.title}
																</p>
																<a
																	href={`https://www.kaggle.com/code/${nb.ref}`}
																	target="_blank"
																	rel="noreferrer"
																	className="ml-2 text-slate-400 hover:text-blue-500 transition-colors"
																	onClick={(e) => e.stopPropagation()}
																	title="View on Kaggle"
																>
																	<Link className="w-3.5 h-3.5" />
																</a>
															</div>
															<p className="text-xs text-slate-500 truncate mt-0.5">
																by {nb.author} &bull;{" "}
																<span className="font-mono">{nb.ref}</span>
															</p>
														</div>
													</label>
												))}
											</div>
										</div>
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
											(searchedNotebooks
												? selectedNotebookSlugs.length === 0
												: !competition) || isImporting
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
