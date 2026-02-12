#!/usr/bin/env node
/**
 * Component Dependency Analyzer
 * 
 * Analyzes component files to identify:
 * - Re-export wrappers (files that only re-export)
 * - Thin wrappers (components with minimal added value)
 * - Component dependencies and usage
 * - Import relationships
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';

interface ComponentMetadata {
  name: string;
  path: string;
  type: 'wrapper' | 'duplicate' | 'unique' | 'parallel' | 'unknown';
  dependencies: string[];
  usedBy: string[];
  isReExportOnly: boolean;
  exportedSymbols: string[];
  importedSymbols: string[];
}

interface AnalysisResult {
  components: Map<string, ComponentMetadata>;
  reExportWrappers: string[];
  thinWrappers: string[];
  duplicateCandidates: string[][];
}

/**
 * Analyzes a TypeScript/TSX file to determine if it's a re-export wrapper
 */
function isReExportWrapper(sourceFile: ts.SourceFile): boolean {
  let hasExport = false;
  let hasNonExportStatement = false;

  function visit(node: ts.Node) {
    // Check for export declarations
    if (ts.isExportDeclaration(node)) {
      hasExport = true;
    }
    // Check for export assignments
    else if (ts.isExportAssignment(node)) {
      hasExport = true;
    }
    // Check for statements that aren't just exports
    else if (
      ts.isVariableStatement(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node)
    ) {
      // Only count if it's not exported
      if (!node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        hasNonExportStatement = true;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // It's a re-export wrapper if it has exports but no other statements
  return hasExport && !hasNonExportStatement;
}

/**
 * Extracts exported symbols from a source file
 */
function getExportedSymbols(sourceFile: ts.SourceFile): string[] {
  const symbols: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          symbols.push(element.name.text);
        }
      }
    } else if (ts.isExportAssignment(node)) {
      if (ts.isIdentifier(node.expression)) {
        symbols.push(node.expression.text);
      }
    } else if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      if (ts.isFunctionDeclaration(node) && node.name) {
        symbols.push(node.name.text);
      } else if (ts.isClassDeclaration(node) && node.name) {
        symbols.push(node.name.text);
      } else if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) {
            symbols.push(declaration.name.text);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return symbols;
}

/**
 * Extracts imported symbols from a source file
 */
function getImportedSymbols(sourceFile: ts.SourceFile): Array<{ symbol: string; from: string }> {
  const imports: Array<{ symbol: string; from: string }> = [];

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const from = moduleSpecifier.text;
        
        if (node.importClause) {
          // Default import
          if (node.importClause.name) {
            imports.push({ symbol: node.importClause.name.text, from });
          }
          
          // Named imports
          if (node.importClause.namedBindings) {
            if (ts.isNamedImports(node.importClause.namedBindings)) {
              for (const element of node.importClause.namedBindings.elements) {
                imports.push({ symbol: element.name.text, from });
              }
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return imports;
}

/**
 * Recursively finds all component files in a directory
 */
function findComponentFiles(dir: string, extensions = ['.tsx', '.ts', '.jsx', '.js']): string[] {
  const files: string[] = [];

  function traverse(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and other common directories
        if (!['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Analyzes component dependencies in the specified directory
 */
export function analyzeComponents(rootDir: string): AnalysisResult {
  const components = new Map<string, ComponentMetadata>();
  const reExportWrappers: string[] = [];
  const thinWrappers: string[] = [];

  // Find all component files
  const componentFiles = findComponentFiles(rootDir);

  // Analyze each file
  for (const filePath of componentFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const isWrapper = isReExportWrapper(sourceFile);
    const exportedSymbols = getExportedSymbols(sourceFile);
    const importedSymbols = getImportedSymbols(sourceFile);

    const metadata: ComponentMetadata = {
      name: path.basename(filePath, path.extname(filePath)),
      path: filePath,
      type: isWrapper ? 'wrapper' : 'unknown',
      dependencies: importedSymbols.map(i => i.from),
      usedBy: [],
      isReExportOnly: isWrapper,
      exportedSymbols,
      importedSymbols: importedSymbols.map(i => i.symbol),
    };

    components.set(filePath, metadata);

    if (isWrapper) {
      reExportWrappers.push(filePath);
    }
  }

  // Build usage graph
  for (const [filePath, metadata] of components) {
    for (const dep of metadata.dependencies) {
      // Try to resolve the dependency to an actual file
      const resolvedPath = resolveDependency(filePath, dep, componentFiles);
      if (resolvedPath && components.has(resolvedPath)) {
        components.get(resolvedPath)!.usedBy.push(filePath);
      }
    }
  }

  return {
    components,
    reExportWrappers,
    thinWrappers,
    duplicateCandidates: findDuplicateCandidates(components),
  };
}

/**
 * Attempts to resolve a dependency path to an actual file
 */
function resolveDependency(fromFile: string, importPath: string, allFiles: string[]): string | null {
  // Handle relative imports
  if (importPath.startsWith('.')) {
    const fromDir = path.dirname(fromFile);
    const resolved = path.resolve(fromDir, importPath);
    
    // Try with different extensions
    for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
      const withExt = resolved + ext;
      if (allFiles.includes(withExt)) {
        return withExt;
      }
    }
    
    // Try index files
    for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
      const indexPath = path.join(resolved, `index${ext}`);
      if (allFiles.includes(indexPath)) {
        return indexPath;
      }
    }
  }

  return null;
}

/**
 * Finds potential duplicate components based on similar names
 */
function findDuplicateCandidates(components: Map<string, ComponentMetadata>): string[][] {
  const nameGroups = new Map<string, string[]>();

  for (const [filePath, metadata] of components) {
    const normalizedName = metadata.name.toLowerCase().replace(/[-_]/g, '');
    
    if (!nameGroups.has(normalizedName)) {
      nameGroups.set(normalizedName, []);
    }
    nameGroups.get(normalizedName)!.push(filePath);
  }

  // Return groups with more than one file
  return Array.from(nameGroups.values()).filter(group => group.length > 1);
}

/**
 * Generates a report of the analysis
 */
export function generateReport(result: AnalysisResult): string {
  const lines: string[] = [];

  lines.push('# Component Dependency Analysis Report\n');
  lines.push(`Total components analyzed: ${result.components.size}\n`);
  lines.push(`Re-export wrappers found: ${result.reExportWrappers.length}\n`);
  lines.push(`Thin wrappers found: ${result.thinWrappers.length}\n`);
  lines.push(`Duplicate candidates: ${result.duplicateCandidates.length}\n`);

  if (result.reExportWrappers.length > 0) {
    lines.push('\n## Re-export Wrappers\n');
    for (const wrapper of result.reExportWrappers) {
      const metadata = result.components.get(wrapper)!;
      lines.push(`- ${wrapper}`);
      lines.push(`  - Exports: ${metadata.exportedSymbols.join(', ')}`);
      lines.push(`  - Used by ${metadata.usedBy.length} file(s)\n`);
    }
  }

  if (result.duplicateCandidates.length > 0) {
    lines.push('\n## Potential Duplicates\n');
    for (const group of result.duplicateCandidates) {
      lines.push(`\n### Similar components:`);
      for (const file of group) {
        lines.push(`- ${file}`);
      }
    }
  }

  return lines.join('\n');
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetDir = process.argv[2] || './source';
  
  console.log(`Analyzing components in: ${targetDir}\n`);
  
  const result = analyzeComponents(targetDir);
  const report = generateReport(result);
  
  console.log(report);
  
  // Write report to file
  const reportPath = path.join(process.cwd(), 'component-analysis-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\nReport written to: ${reportPath}`);
}
