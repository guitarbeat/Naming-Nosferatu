/**
 * @module NameUploadForm
 * @description Admin image upload form for cat photos.
 * Extracted from NameGrid to improve maintainability.
 */

import { imagesAPI } from "@supabase/client";
import { useCallback } from "react";
import { Upload } from "@/icons";
import { compressImageFile, devError } from "@/shared/lib/basic";

interface NameUploadFormProps {
	onImagesUploaded: (uploadedPaths: string[]) => void;
	isAdmin?: boolean;
}

export function NameUploadForm({ onImagesUploaded, isAdmin = false }: NameUploadFormProps) {
	const handleFileUpload = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files || []);
			if (!files.length) {
				return;
			}

			try {
				const uploaded: string[] = [];
				await Promise.all(
					files.map(async (f) => {
						const compressed = await compressImageFile(f, {
							maxWidth: 1600,
							maxHeight: 1600,
							quality: 0.8,
						});
						const result = await imagesAPI.upload(compressed, "admin");
						if (result?.path) {
							uploaded.push(result.path);
						}
					}),
				);
				if (uploaded.length > 0) {
					onImagesUploaded(uploaded);
				}
			} catch (err) {
				devError("Upload error", err);
			}
		},
		[onImagesUploaded],
	);

	if (!isAdmin) {
		return null;
	}

	return (
		<div className="flex justify-center mt-12 mb-8">
			<label className="cursor-pointer flex items-center gap-3 px-8 py-3 bg-purple-600 hover:bg-purple-500 focus-within:ring-4 focus-within:ring-purple-400/50 text-white rounded-full transition-all font-bold tracking-wider uppercase text-sm border border-purple-500/20 active:scale-95 shadow-xl shadow-purple-900/30">
				<input
					type="file"
					accept="image/*"
					multiple={true}
					onChange={handleFileUpload}
					className="sr-only"
				/>
				<Upload size={20} />
				<span>Upload New Cat Photos</span>
			</label>
		</div>
	);
}
