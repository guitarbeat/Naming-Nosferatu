#!/usr/bin/env node
/**
 * Re-export Wrapper Scanner
 * 
 * Task 2.1: Scan codebase for re-export wrapper components
 * 
 * This script identifies files that only contain re-exports and generates
 * a list of wrapper files with their targets.
 * 
 * Requirements: 1.1
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { analyzeComponents } from './analyze-dependencies.js';

interface WrapperInfo {
  wrapperPath: string;
  targetPath: string | null;
  exportedSymbols: string[];
  usedByCount: number;
  usedByFiles: string[];
}

/**
 * Scans the codebase for re-export wrapper components
 */
export function scanForWrappers(rootDir: string): WrapperInfo[] {
  console.log(`Scanning for re-export wrappers in: ${rootDir}\n`);
  
  // Use existing analysis infrastructure
  const analysis = analyzeComponents(rootDir);
  
  const wrappers: WrapperInfo[] = [];
  
  // Process each re-export wrapper
  for (const wrapperPath of analysis.reExportWrappers) {
    const metadata = analysis.components.get(wrapperPath);
    if (!metadata) continue;
    
    // Determine the target path (the file being re-exported)
    let targetPath: string | null = null;
    if (metadata.dependencies.length > 0) {
      // For re-exports, typically there's one main dependency
      const mainDep = metadata.dependencies[0];
      targetPath = resolveDependencyPath(wrapperPath, mainDep);
    }
    
    wrappers.push({
      wrapperPath: path.relative(process.cwd(), wrapperPath),
      targetPath: targetPath ? path.relative(process.cwd(), targetPath) : null,
      exportedSymbols: metadata.exportedSymbols,
      usedByCount: metadata.usedBy.length,
      usedByFiles: metadata.usedBy.map(f => path.relative(process.cwd(), f)),
    });
  }
  
  return wrappers;
}

/**
 * Resolves a dependency import path to an actual file path
 */
function resolveDependencyPath(fromFile: string, importPath: string): string | null {
  if (!importPath.startsWith('.')) {
    // Not a relative import, likely a package or alias
    return null;
  }
  
  const fromDir = path.dirname(fromFile);
  const resolved = path.resolve(fromDir, importPath);
  
  // Try with different extensions
  for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
    const withExt = resolved + ext;
    if (fs.existsSync(withExt)) {
      return withExt;
    }
  }
  
  // Try index files
  for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
    const indexPath = path.join(resolved, `index${ext}`);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }
  
  return null;
}

/**
 * Generates a markdown report of wrapper files
 */
export function generateWrapperReport(wrappers: WrapperInfo[]): string {
  const lines: string[] = [];
  
  lines.push('# Re-export Wrapper Components Report\n');
  lines.push(`Generated: ${new Date().toISOString()}\n`);
  lines.push(`Total wrappers found: ${wrappers.length}\n`);
  
  if (wrappers.length === 0) {
    lines.push('\nNo re-export wrappers found.\n');
    return lines.join('\n');
  }
  
  lines.push('\n## Summary\n');
  lines.push('| Wrapper File | Target File | Exported Symbols | Used By |');
  lines.push('|--------------|-------------|------------------|---------|');
  
  for (const wrapper of wrappers) {
    const target = wrapper.targetPath || 'Unknown';
    const symbols = wrapper.exportedSymbols.join(', ') || 'None';
    const usedBy = wrapper.usedByCount;
    
    lines.push(`| ${wrapper.wrapperPath} | ${target} | ${symbols} | ${usedBy} |`);
  }
  
  lines.push('\n## Detailed Information\n');
  
  for (const wrapper of wrappers) {
    lines.push(`### ${wrapper.wrapperPath}\n`);
    lines.push(`**Target:** ${wrapper.targetPath || 'Unknown'}\n`);
    lines.push(`**Exported Symbols:** ${wrapper.exportedSymbols.join(', ') || 'None'}\n`);
    lines.push(`**Used by ${wrapper.usedByCount} file(s):**\n`);
    
    if (wrapper.usedByFiles.length > 0) {
      for (const file of wrapper.usedByFiles) {
        lines.push(`- ${file}`);
      }
    } else {
      lines.push('- (No files import this wrapper)');
    }
    
    lines.push('');
  }
  
  lines.push('\n## Recommendations\n');
  lines.push('1. For each wrapper, update all importing files to reference the target directly');
  lines.push('2. Remove wrapper files after all imports are updated');
  lines.push('3. Run tests to verify no broken imports remain\n');
  
  return lines.join('\n');
}

/**
 * Generates a JSON file with wrapper information for automated processing
 */
export function generateWrapperJSON(wrappers: WrapperInfo[]): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalWrappers: wrappers.length,
      wrappers: wrappers.map(w => ({
        wrapper: w.wrapperPath,
        target: w.targetPath,
        exports: w.exportedSymbols,
        usedBy: w.usedByFiles,
      })),
    },
    null,
    2
  );
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetDir = process.argv[2] || './source';
  const outputFormat = process.argv[3] || 'markdown'; // 'markdown' or 'json'
  
  try {
    const wrappers = scanForWrappers(targetDir);
    
    if (outputFormat === 'json') {
      const json = generateWrapperJSON(wrappers);
      const outputPath = path.join(process.cwd(), 'wrapper-scan-results.json');
      fs.writeFileSync(outputPath, json);
      console.log(`\nJSON report written to: ${outputPath}`);
      console.log(json);
    } else {
      const report = generateWrapperReport(wrappers);
      const outputPath = path.join(process.cwd(), 'wrapper-scan-results.md');
      fs.writeFileSync(outputPath, report);
      console.log(report);
      console.log(`\nMarkdown report written to: ${outputPath}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error scanning for wrappers:', error);
    process.exit(1);
  }
}
