/**
 * Script to scan codebase for re-export wrapper components
 * Identifies files that only contain re-exports without adding value
 */

import * as fs from 'fs';
import * as path from 'path';

interface WrapperInfo {
  file: string;
  exports: Array<{
    name: string;
    source: string;
    type: 'named' | 'default' | 'namespace';
  }>;
  lineCount: number;
  hasOtherCode: boolean;
}

interface ScanResult {
  wrappers: WrapperInfo[];
  totalFiles: number;
  scannedFiles: number;
}

/**
 * Check if a file is a re-export wrapper
 * A file is considered a wrapper if it:
 * 1. Only contains export statements
 * 2. All exports are re-exports from other files
 * 3. No additional logic, types, or implementations
 */
function analyzeFile(filePath: string): WrapperInfo | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Remove comments first
  const withoutComments = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*/g, ''); // Remove line comments
  
  // Track what we find in the file
  const exports: WrapperInfo['exports'] = [];
  let hasOtherCode = false;

  // Regex patterns for re-exports (now work on full content, not line by line)
  const namedReExportPattern = /export\s+(?:type\s+)?{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/g;
  const defaultReExportPattern = /export\s+{\s*default\s+as\s+(\w+)\s*}\s+from\s+['"]([^'"]+)['"]/g;
  const namespaceReExportPattern = /export\s+\*\s+(?:as\s+(\w+)\s+)?from\s+['"]([^'"]+)['"]/g;
  
  // Find all re-exports
  let match;
  
  // Named re-exports: export { X, Y } from './file' or export type { X } from './file'
  namedReExportPattern.lastIndex = 0;
  while ((match = namedReExportPattern.exec(withoutComments)) !== null) {
    const names = match[1].split(',').map(n => {
      // Handle "type X" within exports
      const cleaned = n.trim().replace(/^type\s+/, '');
      return cleaned.split(' as ')[0].trim();
    });
    const source = match[2];
    names.forEach(name => {
      if (name) {
        exports.push({ name, source, type: 'named' });
      }
    });
  }
  
  // Default re-exports: export { default as X } from './file'
  defaultReExportPattern.lastIndex = 0;
  while ((match = defaultReExportPattern.exec(withoutComments)) !== null) {
    exports.push({ name: match[1], source: match[2], type: 'default' });
  }
  
  // Namespace re-exports: export * from './file' or export * as X from './file'
  namespaceReExportPattern.lastIndex = 0;
  while ((match = namespaceReExportPattern.exec(withoutComments)) !== null) {
    exports.push({ 
      name: match[1] || '*', 
      source: match[2], 
      type: 'namespace' 
    });
  }
  
  // Check if there's any other code besides re-exports
  // Remove all re-export statements and see what's left
  let remainingCode = withoutComments
    .replace(namedReExportPattern, '')
    .replace(defaultReExportPattern, '')
    .replace(namespaceReExportPattern, '')
    .replace(/;/g, '') // Remove semicolons
    .trim();
  
  // If there's substantial code left (not just whitespace), mark as having other code
  const nonWhitespaceLines = remainingCode.split('\n').filter(line => line.trim()).length;
  hasOtherCode = nonWhitespaceLines > 0;
  
  // Count non-comment lines in original content
  const lines = content.split('\n');
  const nonCommentLineCount = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*');
  }).length;
  
  // Only return if file has exports and is primarily re-exports
  if (exports.length > 0 && !hasOtherCode) {
    return {
      file: filePath,
      exports,
      lineCount: nonCommentLineCount,
      hasOtherCode
    };
  }
  
  return null;
}

/**
 * Recursively scan directory for TypeScript/TSX files
 */
function scanDirectory(dir: string, results: ScanResult): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules, dist, build, etc.
      if (!['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
        scanDirectory(fullPath, results);
      }
    } else if (entry.isFile()) {
      results.totalFiles++;
      
      // Only scan TypeScript/TSX files
      if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        results.scannedFiles++;
        
        const wrapperInfo = analyzeFile(fullPath);
        if (wrapperInfo) {
          results.wrappers.push(wrapperInfo);
        }
      }
    }
  }
}

/**
 * Main execution
 */
function main() {
  const sourceDir = path.join(process.cwd(), 'source');
  
  if (!fs.existsSync(sourceDir)) {
    console.error('Error: source directory not found');
    process.exit(1);
  }
  
  console.log('🔍 Scanning codebase for re-export wrapper components...\n');
  
  const results: ScanResult = {
    wrappers: [],
    totalFiles: 0,
    scannedFiles: 0
  };
  
  scanDirectory(sourceDir, results);
  
  // Output results
  console.log(`📊 Scan Results:`);
  console.log(`   Total files: ${results.totalFiles}`);
  console.log(`   TypeScript files scanned: ${results.scannedFiles}`);
  console.log(`   Re-export wrappers found: ${results.wrappers.length}\n`);
  
  if (results.wrappers.length === 0) {
    console.log('✅ No re-export wrapper files found.');
    return;
  }
  
  console.log('📋 Re-export Wrapper Files:\n');
  
  for (const wrapper of results.wrappers) {
    const relativePath = path.relative(process.cwd(), wrapper.file);
    console.log(`📄 ${relativePath}`);
    console.log(`   Lines: ${wrapper.lineCount}`);
    console.log(`   Exports: ${wrapper.exports.length}`);
    console.log(`   Targets:`);
    
    // Group exports by source
    const bySource = new Map<string, string[]>();
    for (const exp of wrapper.exports) {
      if (!bySource.has(exp.source)) {
        bySource.set(exp.source, []);
      }
      bySource.get(exp.source)!.push(exp.name);
    }
    
    for (const [source, names] of bySource) {
      console.log(`      ${source} → [${names.join(', ')}]`);
    }
    console.log('');
  }
  
  // Generate summary report
  const reportPath = path.join(process.cwd(), 'scripts', 'reexport-wrappers-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.totalFiles,
      scannedFiles: results.scannedFiles,
      wrappersFound: results.wrappers.length
    },
    wrappers: results.wrappers.map(w => ({
      file: path.relative(process.cwd(), w.file),
      lineCount: w.lineCount,
      exportCount: w.exports.length,
      exports: w.exports
    }))
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📝 Detailed report saved to: ${path.relative(process.cwd(), reportPath)}`);
}

main();
