#!/usr/bin/env node

/**
 * Sound Optimization Script
 * Compresses and optimizes audio files
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SOUNDS_DIR = "public/assets/sounds";

function getFileSize(filePath) {
	try {
		return fs.statSync(filePath).size;
	} catch {
		return 0;
	}
}

function checkFFmpeg() {
	try {
		execSync("ffmpeg -version", { stdio: "pipe" });
		return true;
	} catch {
		return false;
	}
}

function analyzeSounds() {
	console.log("🔊 Analyzing sound files...\n");

	const sounds = fs
		.readdirSync(SOUNDS_DIR)
		.filter((file) => file.endsWith(".mp3") || file.endsWith(".wav") || file.endsWith(".ogg"));

	let totalSize = 0;
	const soundInfo = sounds.map((sound) => {
		const filePath = path.join(SOUNDS_DIR, sound);
		const size = getFileSize(filePath);
		totalSize += size;
		return {
			name: sound,
			path: filePath,
			size,
			sizeMB: Math.round((size / 1024 / 1024) * 100) / 100,
			ext: path.extname(sound).toLowerCase(),
		};
	});

	soundInfo.sort((a, b) => b.size - a.size);

	console.log(
		`Found ${sounds.length} sound files (${Math.round((totalSize / 1024 / 1024) * 100) / 100} MB total):\n`,
	);

	soundInfo.forEach((sound) => {
		console.log(`  📁 ${sound.name}: ${sound.sizeMB} MB`);
	});

	return soundInfo;
}

function optimizeWithFFmpeg(soundInfo) {
	console.log("\n🎵 Optimizing with FFmpeg...\n");

	let totalSaved = 0;
	let optimizedCount = 0;

	soundInfo.forEach((sound) => {
		if (sound.ext !== ".mp3") {
			return;
		}

		const outputPath = sound.path.replace(".mp3", "_optimized.mp3");
		const tempPath = sound.path.replace(".mp3", "_temp.mp3");

		try {
			// Convert to 128kbps MP3 with optimized settings
			execSync(`ffmpeg -i "${sound.path}" -b:a 128k -acodec libmp3lame -ar 44100 "${tempPath}"`, {
				stdio: "pipe",
			});

			const originalSize = sound.size;
			const optimizedSize = getFileSize(tempPath);

			if (optimizedSize < originalSize && optimizedSize > 0) {
				// Backup original and replace
				fs.renameSync(sound.path, `${outputPath}.backup`);
				fs.renameSync(tempPath, sound.path);

				const saved = originalSize - optimizedSize;
				totalSaved += saved;
				optimizedCount++;

				console.log(`  ✅ Optimized ${sound.name}:`);
				console.log(
					`     ${Math.round((originalSize / 1024 / 1024) * 100) / 100} MB → ${Math.round((optimizedSize / 1024 / 1024) * 100) / 100} MB`,
				);
				console.log(`     Saved ${Math.round((saved / 1024 / 1024) * 100) / 100} MB`);
			} else {
				// Remove temp file if no improvement
				fs.unlinkSync(tempPath);
				console.log(`  ⏭️  Skipped ${sound.name} (already optimized)`);
			}
		} catch (err) {
			console.error(`  ❌ Failed to optimize ${sound.name}: ${err.message}`);
			// Clean up temp file
			try {
				if (fs.existsSync(tempPath)) {
					fs.unlinkSync(tempPath);
				}
			} catch {
				// Ignore cleanup errors
			}
		}
	});

	if (totalSaved > 0) {
		console.log("\n💾 Sound optimization complete!");
		console.log(`📊 Optimized ${optimizedCount} files`);
		console.log(`💰 Saved ${Math.round((totalSaved / 1024 / 1024) * 100) / 100} MB`);
	}

	return totalSaved;
}

function provideRecommendations(soundInfo) {
	console.log("\n💡 Sound optimization recommendations:\n");

	console.log("🎯 Quick wins:");
	console.log("  • Convert MP3 files to OGG format for 30-50% better compression");
	console.log("  • Reduce bitrate to 128kbps for background music");
	console.log("  • Use 96kbps for sound effects");
	console.log("  • Consider shorter versions or loops for repeated sounds\n");

	const largeFiles = soundInfo.filter((s) => s.size > 1024 * 1024); // > 1MB
	if (largeFiles.length > 0) {
		console.log("📁 Large files to prioritize:");
		largeFiles.forEach((sound) => {
			console.log(`  • ${sound.name} (${sound.sizeMB} MB)`);
		});
		console.log("");
	}

	console.log("🛠️  Tools for audio optimization:");
	console.log("  • FFmpeg: https://ffmpeg.org/download.html");
	console.log("  • Audacity: https://www.audacityteam.org/ (GUI)");
	console.log("  • Online: https://www.mp3smaller.com/ or https://www.audioconverter.com/");
}

function main() {
	console.log("🚀 Starting sound optimization...\n");

	if (!fs.existsSync(SOUNDS_DIR)) {
		console.error("❌ Sounds directory not found!");
		process.exit(1);
	}

	const soundInfo = analyzeSounds();

	if (checkFFmpeg()) {
		console.log("✅ FFmpeg detected - can optimize automatically");
		const saved = optimizeWithFFmpeg(soundInfo);
		if (saved === 0) {
			console.log("\n📊 Files are already well optimized!");
		}
	} else {
		console.log("⚠️  FFmpeg not available for automatic optimization");
	}

	provideRecommendations(soundInfo);

	console.log("\n🎉 Sound analysis complete!");
}

main();
