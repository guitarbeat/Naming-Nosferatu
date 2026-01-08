# Asset Optimization Guide

This guide explains how to optimize assets to keep your repository lightweight and improve loading performance.

## 🎯 What We've Done

### ✅ Image Optimization (5.08 MB saved)
- **Removed 28 duplicate image files** - kept only the most efficient AVIF format
- **Updated gallery.json** to reference optimized images
- **Automated optimization** integrated into build process

### 📊 Current Status
- **Images**: All optimized to AVIF format (best compression)
- **Sounds**: 25.11 MB total (9 MP3 files) - manual optimization needed
- **Git Protection**: Added .gitignore rules to prevent large files

## 🚀 Quick Commands

```bash
# Optimize all assets (images + analysis)
npm run optimize:assets

# Optimize images only
npm run optimize:images

# Analyze sound files
npm run optimize:sounds

# Build with automatic image optimization
npm run build
```

## 🎵 Sound Optimization (25 MB → ~15-18 MB potential savings)

Your sound files are the largest remaining assets. Here's how to optimize them:

### Option 1: Online Tools (Quick)
1. Visit https://www.mp3smaller.com/
2. Upload your MP3 files
3. Choose 128kbps bitrate for background music
4. Choose 96kbps for sound effects
5. Download optimized versions

### Option 2: FFmpeg (Best quality)
```bash
# Install FFmpeg: https://ffmpeg.org/download.html

# Convert to optimized MP3 (128kbps)
ffmpeg -i "input.mp3" -b:a 128k -acodec libmp3lame -ar 44100 "output.mp3"

# Convert to OGG (better compression)
ffmpeg -i "input.mp3" -c:a libvorbis -q:a 4 "output.ogg"
```

### Priority Files to Optimize:
- `AdhesiveWombat - Night Shade.mp3` (6.26 MB)
- `what-is-love.mp3` (5.88 MB)
- `Lemon Demon - The Ultimate Showdown (8-Bit Remix).mp3` (5.49 MB)
- `MiseryBusiness.mp3` (4.83 MB)
- `Main Menu 1 (Ruins).mp3` (2.4 MB)

## 🛡️ Prevention Measures

### .gitignore Rules Added
- Prevents accidental commit of large media files
- Allows optimized web formats (jpg, png, webp, avif, svg)
- Blocks uncompressed formats (psd, tiff, bmp)

### Build Integration
- Images are automatically optimized during `npm run build`
- Ensures new images are always compressed

## 📈 Performance Impact

| Asset Type | Before | After | Savings |
|------------|--------|-------|---------|
| Images | ~8-10 MB | ~3-4 MB | **5.08 MB** |
| Sounds | 25.11 MB | ~15-18 MB* | **7-10 MB** |
| **Total** | **~33-35 MB** | **~18-22 MB** | **~12-15 MB** |

*Estimated with MP3→OGG conversion and bitrate reduction

## 🔧 Advanced Optimization

### For Images:
```bash
# Install optimization tools
npm install -D sharp imagemin imagemin-webp imagemin-avif

# Or use the build script
npm run optimize:images
```

### For Sounds:
Consider switching to Web Audio API with compressed formats:
- **OGG**: 30-50% smaller than MP3
- **M4A/AAC**: Good compression with wide support
- **WebM Audio**: Modern format with excellent compression

## 📋 Maintenance Checklist

- [ ] Run `npm run optimize:assets` before major commits
- [ ] Check file sizes: `npm run optimize:sounds`
- [ ] Test application after optimization
- [ ] Update gallery.json if adding new images
- [ ] Use AVIF/WebP formats for new images

## 🆘 Troubleshooting

### Build fails with optimization errors?
```bash
# Skip optimization for debugging
npm run build:dev
```

### Need to restore original images?
```bash
# Check git history
git log --name-only -- public/assets/images/
git checkout <commit> -- public/assets/images/
```

### Large files still getting committed?
- Check .gitignore rules
- Use `git ls-files` to see tracked files
- Remove large files: `git rm --cached large-file.mp3`

---

**Pro tip**: Set up a pre-commit hook to automatically check file sizes before commits!