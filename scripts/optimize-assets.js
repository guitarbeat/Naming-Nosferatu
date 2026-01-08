#!/usr/bin/env node

/**
 * Asset Optimization Script
 * Removes duplicate image formats and compresses assets
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ASSETS_DIR = "public/assets";
const IMAGES_DIR = path.join(ASSETS_DIR, "images");
const SOUNDS_DIR = path.join(ASSETS_DIR, "sounds");

// Priority order for image formats (most efficient first)
const IMAGE_FORMAT_PRIORITY = ["avif", "webp", "jpg", "jpeg", "gif", "svg"];

function getFileSize(filePath) {
	try {
		return fs.statSync(filePath).size;
	} catch {
		return 0;
	}
}

function getImageGroups() {
	const images = fs.readdirSync(IMAGES_DIR).filter((file) => {
		const ext = path.extname(file).toLowerCase().slice(1);
		return IMAGE_FORMAT_PRIORITY.includes(ext) && !file.includes("favicon");
	});

	const groups = {};

	images.forEach((file) => {
		const nameWithoutExt = file.replace(/\.[^.]+$/, "");
		const baseName = nameWithoutExt.replace(/\.(avif|webp|jpg|jpeg)$/, "");

		if (!groups[baseName]) {
			groups[baseName] = [];
		}
		groups[baseName].push(file);
	});

	return groups;
}

function optimizeImages() {
	console.log("🔍 Analyzing images...");

	const groups = getImageGroups();
	let totalSaved = 0;
	let filesRemoved = 0;

	Object.entries(groups).forEach(([baseName, files]) => {
		if (files.length <= 1) {
			return;
		}

		console.log(`\n📁 Processing ${baseName}:`);

		// Sort files by format priority and size
		const sortedFiles = files
			.map((file) => ({
				name: file,
				path: path.join(IMAGES_DIR, file),
				ext: path.extname(file).toLowerCase().slice(1),
				size: getFileSize(path.join(IMAGES_DIR, file)),
			}))
			.sort((a, b) => {
				// First sort by format priority
				const aPriority = IMAGE_FORMAT_PRIORITY.indexOf(a.ext);
				const bPriority = IMAGE_FORMAT_PRIORITY.indexOf(b.ext);
				if (aPriority !== bPriority) {
					return aPriority - bPriority;
				}
				// Then by size (smaller first)
				return a.size - b.size;
			});

		console.log(
			`  Found ${files.length} formats: ${sortedFiles.map((f) => `${f.ext}(${Math.round(f.size / 1024)}KB)`).join(", ")}`,
		);

		// Keep the best format, remove others
		const keepFile = sortedFiles[0];
		const removeFiles = sortedFiles.slice(1);

		console.log(`  ✅ Keeping: ${keepFile.name} (${Math.round(keepFile.size / 1024)}KB)`);

		removeFiles.forEach((file) => {
			console.log(`  🗑️  Removing: ${file.name} (${Math.round(file.size / 1024)}KB)`);
			try {
				fs.unlinkSync(file.path);
				totalSaved += file.size;
				filesRemoved++;
			} catch (err) {
				console.error(`    ❌ Failed to remove ${file.name}: ${err.message}`);
			}
		});
	});

	console.log("\n💾 Image optimization complete!");
	console.log(`📊 Removed ${filesRemoved} duplicate files`);
	console.log(`💰 Saved ${Math.round((totalSaved / 1024 / 1024) * 100) / 100} MB`);
}

function optimizeSounds() {
	console.log("\n🔊 Analyzing sounds...");

	const sounds = fs
		.readdirSync(SOUNDS_DIR)
		.filter((file) => file.endsWith(".mp3") || file.endsWith(".wav") || file.endsWith(".ogg"));

	console.log(`Found ${sounds.length} sound files:`);
	sounds.forEach((sound) => {
		const filePath = path.join(SOUNDS_DIR, sound);
		const size = getFileSize(filePath);
		console.log(`  📁 ${sound}: ${Math.round((size / 1024 / 1024) * 100) / 100} MB`);
	});

	console.log("\n💡 Sound optimization suggestions:");
	console.log("  • Convert MP3 files to OGG format for better compression");
	console.log("  • Reduce bitrate to 128kbps for non-critical sounds");
	console.log("  • Consider using shorter/looped versions where possible");

	// Check if ffmpeg is available for audio optimization
	try {
		execSync("ffmpeg -version", { stdio: "pipe" });
		console.log("  ✅ FFmpeg available for audio compression");
	} catch {
		console.log(
			"  ⚠️  FFmpeg not available. Install it for audio optimization: https://ffmpeg.org/download.html",
		);
	}
}

function updateGalleryJson() {
	console.log("\n📝 Updating gallery.json...");

	const galleryPath = path.join(IMAGES_DIR, "gallery.json");

	if (!fs.existsSync(galleryPath)) {
		console.log("  ⚠️  gallery.json not found, skipping update");
		return;
	}

	try {
		const gallery = JSON.parse(fs.readFileSync(galleryPath, "utf8"));
		const optimizedGallery = gallery.map((imagePath) => {
			// Extract filename without extension
			const fileName = path.basename(imagePath, path.extname(imagePath));

			// Check which optimized version exists
			for (const ext of IMAGE_FORMAT_PRIORITY) {
				const testPath = path.join(IMAGES_DIR, `${fileName}.${ext}`);
				if (fs.existsSync(testPath)) {
					return `/assets/images/${fileName}.${ext}`;
				}
			}

			// Fallback to original if no optimized version found
			return imagePath;
		});

		fs.writeFileSync(galleryPath, JSON.stringify(optimizedGallery, null, 2));
		console.log("  ✅ Updated gallery.json references");
	} catch (err) {
		console.error(`  ❌ Failed to update gallery.json: ${err.message}`);
	}
}

function main() {
	console.log("🚀 Starting asset optimization...\n");

	if (!fs.existsSync(ASSETS_DIR)) {
		console.error("❌ Assets directory not found!");
		process.exit(1);
	}

	optimizeImages();
	optimizeSounds();
	updateGalleryJson();

	console.log("\n🎉 Asset optimization complete!");
	console.log("\n📋 Next steps:");
	console.log("  1. Review the changes and commit them");
	console.log("  2. Test your application to ensure everything works");
	console.log("  3. Consider setting up automated optimization in your build process");
}

main();
