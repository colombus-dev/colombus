import { FileJson, Loader2, Upload, X } from "lucide-react";
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

interface ImportModalProps {
	onImport: (files: File[]) => Promise<void>;
	isImporting: boolean;
	children: React.ReactNode;
}

export default function ImportModal({
	onImport,
	isImporting,
	children,
}: ImportModalProps) {
	const [open, setOpen] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [dropError, setDropError] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);

	const onDrop = useCallback(
		(
			acceptedFiles: File[],
			fileRejections: import("react-dropzone").FileRejection[],
		) => {
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
					const newFiles = allValidFiles.filter(
						(newFile) =>
							!prev.some((existing) => existing.name === newFile.name),
					);
					return [...prev, ...newFiles];
				});
			}
			setServerError(null);
		},
		[],
	);

	const onDropRejected = useCallback(
		(fileRejections: import("react-dropzone").FileRejection[]) => {
			const hasValidExtension = fileRejections.some(
				(r) =>
					r.file.name.toLowerCase().endsWith(NotebookFileExtension) ||
					r.file.name.toLowerCase().endsWith(ProfileFileExtension),
			);
			if (!hasValidExtension) {
				setDropError(true);
			}
		},
		[],
	);

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
		} catch (error: unknown) {
			if (error instanceof Error) {
				setServerError(error.message);
			} else {
				setServerError(String(error));
			}
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!isImporting) {
			setOpen(newOpen);
			if (!newOpen) {
				setSelectedFiles([]);
				setDropError(false);
				setServerError(null);
			}
		}
	};

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
								className={`text-sm font-medium mb-1 whitespace-pre-line ${dropError || serverError ? "text-red-500" : "text-slate-900 dark:text-slate-100"}`}
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
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
