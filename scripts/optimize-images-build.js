#!/usr/bin/env node

/**
 * Build-time Image Optimization Script
 * Automatically optimizes images during the build process
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PUBLIC_DIR = "public";
const ASSETS_DIR = path.join(PUBLIC_DIR, "assets");
const IMAGES_DIR = path.join(ASSETS_DIR, "images");

// Optimization settings
const OPTIMIZATION_SETTINGS = {
	avif: { quality: 80, effort: 6 },
	webp: { quality: 85, effort: 6 },
	jpg: { quality: 85, progressive: true },
	jpeg: { quality: 85, progressive: true },
	png: { quality: 85, compressionLevel: 9 },
};

async function optimizeImage(inputPath, outputPath, format) {
	const settings = OPTIMIZATION_SETTINGS[format];

	if (!settings) {
		throw new Error(`Unsupported format: ${format}`);
	}

	let pipeline = sharp(inputPath);

	switch (format) {
		case "avif":
			pipeline = pipeline.avif(settings);
			break;
		case "webp":
			pipeline = pipeline.webp(settings);
			break;
		case "jpg":
		case "jpeg":
			pipeline = pipeline.jpeg(settings);
			break;
		case "png":
			pipeline = pipeline.png(settings);
			break;
	}

	await pipeline.toFile(outputPath);
}

function getImageFiles() {
	if (!fs.existsSync(IMAGES_DIR)) {
		console.log("No images directory found, skipping optimization");
		return [];
	}

	return fs
		.readdirSync(IMAGES_DIR)
		.filter((file) => {
			const ext = path.extname(file).toLowerCase().slice(1);
			return Object.keys(OPTIMIZATION_SETTINGS).includes(ext);
		})
		.map((file) => path.join(IMAGES_DIR, file));
}

async function optimizeImages() {
	console.log("🖼️  Optimizing images for production...");

	const imageFiles = getImageFiles();

	if (imageFiles.length === 0) {
		console.log("No images to optimize");
		return;
	}

	console.log(`Found ${imageFiles.length} images to optimize`);

	for (const imagePath of imageFiles) {
		const fileName = path.basename(imagePath, path.extname(imagePath));
		const outputDir = path.dirname(imagePath);

		try {
			// Generate AVIF version (most efficient)
			const avifPath = path.join(outputDir, `${fileName}.avif`);
			if (!fs.existsSync(avifPath)) {
				await optimizeImage(imagePath, avifPath, "avif");
				console.log(`  ✅ Generated ${fileName}.avif`);
			}

			// Generate WebP version as fallback
			const webpPath = path.join(outputDir, `${fileName}.webp`);
			if (!fs.existsSync(webpPath)) {
				await optimizeImage(imagePath, webpPath, "webp");
				console.log(`  ✅ Generated ${fileName}.webp`);
			}
		} catch (err) {
			console.error(`  ❌ Failed to optimize ${fileName}: ${err.message}`);
		}
	}

	console.log("🎉 Image optimization complete!");
}

async function main() {
	try {
		await optimizeImages();
	} catch (err) {
		console.error("Image optimization failed:", err);
		process.exit(1);
	}
}

main();
