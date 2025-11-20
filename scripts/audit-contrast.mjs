#!/usr/bin/env node

/**
 * Contrast Ratio Audit Tool
 * Audits CSS files for WCAG contrast compliance
 * Tests both AA (4.5:1) and AAA (7:1) standards
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Parse RGB color from various formats
 */
function parseColor(colorStr) {
  if (!colorStr) return null;

  // Remove whitespace
  colorStr = colorStr.trim();

  // Hex color
  if (colorStr.startsWith("#")) {
    return hexToRgb(colorStr);
  }

  // rgb() or rgba()
  const rgbMatch = colorStr.match(
    /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\)/i,
  );
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // rgb() with spaces
  const rgbSpaceMatch = colorStr.match(
    /rgba?\((\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*[\d.]+)?\)/i,
  );
  if (rgbSpaceMatch) {
    return {
      r: parseInt(rgbSpaceMatch[1], 10),
      g: parseInt(rgbSpaceMatch[2], 10),
      b: parseInt(rgbSpaceMatch[3], 10),
    };
  }

  return null;
}

/**
 * Calculate relative luminance
 */
function getLuminance(rgb) {
  const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1, color2) {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  if (!rgb1 || !rgb2) return null;

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Extract color values from CSS
 */
function extractColors(cssContent) {
  const colors = new Set();

  // Extract CSS custom properties
  const varMatches = cssContent.matchAll(
    /--[\w-]+:\s*([^;]+);/g,
  );
  for (const match of varMatches) {
    const value = match[1].trim();
    // Check if it's a color value
    if (
      value.match(/^#[0-9a-fA-F]{3,8}$/) ||
      value.match(/^rgb/) ||
      value.match(/^hsl/)
    ) {
      colors.add(value);
    }
  }

  // Extract direct color values
  const colorMatches = cssContent.matchAll(
    /(?:color|background|border-color|outline-color):\s*([^;]+);/gi,
  );
  for (const match of colorMatches) {
    const value = match[1].trim();
    if (
      value.match(/^#[0-9a-fA-F]{3,8}$/) ||
      value.match(/^rgb/) ||
      value.match(/^hsl/) ||
      value.match(/^var\(/)
    ) {
      colors.add(value);
    }
  }

  return Array.from(colors);
}

/**
 * Get all CSS files recursively
 */
function getAllCssFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, build, coverage
      if (
        !file.startsWith(".") &&
        file !== "node_modules" &&
        file !== "dist" &&
        file !== "build" &&
        file !== "coverage"
      ) {
        getAllCssFiles(filePath, fileList);
      }
    } else if (extname(file) === ".css") {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Resolve CSS variable to actual color
 */
function resolveVariable(varName, cssContent) {
  // Extract variable definition
  const varDef = cssContent.match(
    new RegExp(`--${varName.replace("--", "")}:\\s*([^;]+);`),
  );
  if (varDef) {
    const value = varDef[1].trim();
    // If it's another variable, try to resolve it
    if (value.startsWith("var(")) {
      const nestedVar = value.match(/var\(--([\w-]+)\)/);
      if (nestedVar) {
        return resolveVariable(nestedVar[1], cssContent);
      }
    }
    return value;
  }
  return null;
}

/**
 * Main audit function
 */
function auditContrast() {
  console.log("🔍 Starting contrast ratio audit...\n");

  const cssFiles = getAllCssFiles(join(projectRoot, "src"));
  const allCssContent = cssFiles
    .map((file) => readFileSync(file, "utf-8"))
    .join("\n");

  // Extract all colors
  const colors = extractColors(allCssContent);

  // Common background colors from theme files
  const backgrounds = [
    "#020617", // dark background
    "#0b1120", // dark surface
    "#0f172a", // dark surface-muted
    "#ffffff", // light background
    "#f4f7fb", // light background
    "#f1f5fb", // light surface-muted
  ];

  // Common text colors
  const textColors = [
    "#f8fafc", // text-primary dark
    "#e2e8f0", // text-secondary dark
    "#cbd5e1", // text-tertiary dark
    "#0f172a", // text-primary light
    "#475569", // text-secondary light
    "#64748b", // text-tertiary light
    "#94a3b8", // muted-foreground
  ];

  const issues = [];
  const tested = new Set();

  // Test text/background combinations
  for (const textColor of textColors) {
    for (const bgColor of backgrounds) {
      const key = `${textColor}-${bgColor}`;
      if (tested.has(key)) continue;
      tested.add(key);

      const ratio = getContrastRatio(textColor, bgColor);
      if (ratio === null) continue;

      const passesAA = ratio >= 4.5;
      const passesAAA = ratio >= 7.0;

      if (!passesAAA) {
        issues.push({
          textColor,
          bgColor,
          ratio: ratio.toFixed(2),
          passesAA,
          passesAAA,
          severity: passesAA ? "warning" : "error",
        });
      }
    }
  }

  // Test colors from CSS files
  for (const color of colors) {
    if (color.startsWith("var(")) continue; // Skip variables for now

    for (const bgColor of backgrounds) {
      const key = `${color}-${bgColor}`;
      if (tested.has(key)) continue;
      tested.add(key);

      const ratio = getContrastRatio(color, bgColor);
      if (ratio === null) continue;

      const passesAA = ratio >= 4.5;
      const passesAAA = ratio >= 7.0;

      if (!passesAAA) {
        issues.push({
          textColor: color,
          bgColor,
          ratio: ratio.toFixed(2),
          passesAA,
          passesAAA,
          severity: passesAA ? "warning" : "error",
        });
      }
    }
  }

  // Generate report
  console.log(`📊 Audit Results:\n`);
  console.log(`   Files scanned: ${cssFiles.length}`);
  console.log(`   Colors found: ${colors.length}`);
  console.log(`   Combinations tested: ${tested.size}`);
  console.log(`   Issues found: ${issues.length}\n`);

  if (issues.length === 0) {
    console.log("✅ All color combinations meet WCAG AAA (7:1) standards!\n");
    return;
  }

  // Group by severity
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  if (errors.length > 0) {
    console.log(`❌ Errors (fails WCAG AA - 4.5:1): ${errors.length}\n`);
    errors.forEach((issue) => {
      console.log(
        `   Text: ${issue.textColor.padEnd(20)} | BG: ${issue.bgColor.padEnd(20)} | Ratio: ${issue.ratio}:1`,
      );
    });
    console.log();
  }

  if (warnings.length > 0) {
    console.log(
      `⚠️  Warnings (passes AA but fails AAA - 7:1): ${warnings.length}\n`,
    );
    warnings.forEach((issue) => {
      console.log(
        `   Text: ${issue.textColor.padEnd(20)} | BG: ${issue.bgColor.padEnd(20)} | Ratio: ${issue.ratio}:1`,
      );
    });
    console.log();
  }

  // Generate suggestions
  console.log("💡 Suggestions:\n");
  issues.forEach((issue) => {
    const rgb = parseColor(issue.textColor);
    if (!rgb) return;

    // Suggest lighter text for dark backgrounds
    if (issue.bgColor.startsWith("#0") || issue.bgColor.startsWith("#1")) {
      const currentLum = getLuminance(rgb);
      const targetLum = currentLum * (7.0 / parseFloat(issue.ratio));
      if (targetLum > 1) targetLum = 1;

      // Approximate lighter color
      const factor = Math.min(targetLum / currentLum, 1.5);
      const newR = Math.min(255, Math.round(rgb.r * factor));
      const newG = Math.min(255, Math.round(rgb.g * factor));
      const newB = Math.min(255, Math.round(rgb.b * factor));

      console.log(
        `   ${issue.textColor} on ${issue.bgColor}: Consider using rgb(${newR}, ${newG}, ${newB}) for 7:1 ratio`,
      );
    }
  });

  // Exit with error code if there are failures
  if (errors.length > 0) {
    process.exit(1);
  }
}

// Run audit
auditContrast();

