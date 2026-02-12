#!/usr/bin/env node
/**
 * Import Update Automation
 * 
 * Uses TypeScript compiler API to automatically update import statements
 * when components are moved, renamed, or consolidated.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';

interface ImportUpdate {
  file: string;
  oldImport: string;
  newImport: string;
  importName?: string;
}

interface UpdateResult {
  success: boolean;
  filesUpdated: number;
  errors: string[];
}

/**
 * Finds all files that import from a specific module
 */
export function findImportReferences(
  rootDir: string,
  targetModule: string
): Array<{ file: string; imports: string[] }> {
  const references: Array<{ file: string; imports: string[] }> = [];
  const files = findAllFiles(rootDir, ['.tsx', '.ts', '.jsx', '.js']);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const sourceFile = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const imports = findImportsFromModule(sourceFile, targetModule);
    if (imports.length > 0) {
      references.push({ file, imports });
    }
  }

  return references;
}

/**
 * Finds import statements from a specific module in a source file
 */
function findImportsFromModule(sourceFile: ts.SourceFile, targetModule: string): string[] {
  const imports: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        
        // Check if this import matches the target module
        if (importPath === targetModule || importPath.endsWith(targetModule)) {
          if (node.importClause) {
            // Default import
            if (node.importClause.name) {
              imports.push(node.importClause.name.text);
            }
            
            // Named imports
            if (node.importClause.namedBindings) {
              if (ts.isNamedImports(node.importClause.namedBindings)) {
                for (const element of node.importClause.namedBindings.elements) {
                  imports.push(element.name.text);
                }
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
 * Updates import statements in a file
 */
export function updateImportsInFile(
  filePath: string,
  updates: ImportUpdate[]
): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let updatedContent = content;

    // Sort updates by position (descending) to avoid offset issues
    const sortedUpdates = [...updates].sort((a, b) => {
      const posA = content.indexOf(a.oldImport);
      const posB = content.indexOf(b.oldImport);
      return posB - posA;
    });

    for (const update of sortedUpdates) {
      updatedContent = updatedContent.replace(
        new RegExp(escapeRegExp(update.oldImport), 'g'),
        update.newImport
      );
    }

    if (updatedContent !== content) {
      fs.writeFileSync(filePath, updatedContent, 'utf-8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error updating file ${filePath}:`, error);
    return false;
  }
}

/**
 * Batch updates imports across multiple files
 */
export function batchUpdateImports(
  rootDir: string,
  oldModulePath: string,
  newModulePath: string
): UpdateResult {
  const result: UpdateResult = {
    success: true,
    filesUpdated: 0,
    errors: [],
  };

  try {
    // Find all files that import from the old module
    const references = findImportReferences(rootDir, oldModulePath);

    for (const { file, imports } of references) {
      const updates: ImportUpdate[] = imports.map(importName => ({
        file,
        oldImport: oldModulePath,
        newImport: newModulePath,
        importName,
      }));

      const updated = updateImportsInFile(file, updates);
      if (updated) {
        result.filesUpdated++;
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

/**
 * Updates imports when a component is renamed
 */
export function updateImportsForRename(
  rootDir: string,
  oldName: string,
  newName: string,
  modulePath: string
): UpdateResult {
  const result: UpdateResult = {
    success: true,
    filesUpdated: 0,
    errors: [],
  };

  try {
    const files = findAllFiles(rootDir, ['.tsx', '.ts', '.jsx', '.js']);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const sourceFile = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      let needsUpdate = false;
      let updatedContent = content;

      function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node)) {
          const moduleSpecifier = node.moduleSpecifier;
          if (ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text === modulePath) {
            if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
              for (const element of node.importClause.namedBindings.elements) {
                if (element.name.text === oldName) {
                  // Replace the import name
                  const oldText = element.getText(sourceFile);
                  const newText = oldText.replace(oldName, newName);
                  updatedContent = updatedContent.replace(oldText, newText);
                  needsUpdate = true;
                }
              }
            }
          }
        }

        ts.forEachChild(node, visit);
      }

      visit(sourceFile);

      if (needsUpdate) {
        fs.writeFileSync(file, updatedContent, 'utf-8');
        result.filesUpdated++;
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

/**
 * Generates import update plan for component consolidation
 */
export function generateUpdatePlan(
  rootDir: string,
  consolidationMap: Map<string, string>
): Array<{ file: string; updates: ImportUpdate[] }> {
  const plan: Array<{ file: string; updates: ImportUpdate[] }> = [];
  const files = findAllFiles(rootDir, ['.tsx', '.ts', '.jsx', '.js']);

  for (const file of files) {
    const updates: ImportUpdate[] = [];

    for (const [oldPath, newPath] of consolidationMap) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes(oldPath)) {
        updates.push({
          file,
          oldImport: oldPath,
          newImport: newPath,
        });
      }
    }

    if (updates.length > 0) {
      plan.push({ file, updates });
    }
  }

  return plan;
}

/**
 * Validates that all imports can be resolved after updates
 */
export function validateImports(rootDir: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    // Create a TypeScript program to check for errors
    const configPath = ts.findConfigFile(rootDir, ts.sys.fileExists, 'tsconfig.json');
    
    if (!configPath) {
      errors.push('Could not find tsconfig.json');
      return { valid: false, errors };
    }

    const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
    const { options, fileNames } = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      path.dirname(configPath)
    );

    const program = ts.createProgram(fileNames, options);
    const diagnostics = ts.getPreEmitDiagnostics(program);

    // Filter for import-related errors
    for (const diagnostic of diagnostics) {
      if (diagnostic.file) {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        if (message.includes('Cannot find module') || message.includes('import')) {
          errors.push(`${diagnostic.file.fileName}: ${message}`);
        }
      }
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Helper function to find all files with specific extensions
 */
function findAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  function traverse(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
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
 * Escapes special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (command === 'find') {
    const rootDir = process.argv[3] || './source';
    const targetModule = process.argv[4];
    
    if (!targetModule) {
      console.error('Usage: update-imports.ts find <rootDir> <targetModule>');
      process.exit(1);
    }
    
    const references = findImportReferences(rootDir, targetModule);
    console.log(`Found ${references.length} files importing from ${targetModule}:\n`);
    
    for (const { file, imports } of references) {
      console.log(`${file}:`);
      console.log(`  Imports: ${imports.join(', ')}\n`);
    }
  } else if (command === 'update') {
    const rootDir = process.argv[3] || './source';
    const oldPath = process.argv[4];
    const newPath = process.argv[5];
    
    if (!oldPath || !newPath) {
      console.error('Usage: update-imports.ts update <rootDir> <oldPath> <newPath>');
      process.exit(1);
    }
    
    console.log(`Updating imports from ${oldPath} to ${newPath}...\n`);
    
    const result = batchUpdateImports(rootDir, oldPath, newPath);
    
    if (result.success) {
      console.log(`✓ Successfully updated ${result.filesUpdated} file(s)`);
    } else {
      console.error('✗ Update failed:');
      for (const error of result.errors) {
        console.error(`  - ${error}`);
      }
      process.exit(1);
    }
  } else if (command === 'validate') {
    const rootDir = process.argv[3] || './source';
    
    console.log('Validating imports...\n');
    
    const { valid, errors } = validateImports(rootDir);
    
    if (valid) {
      console.log('✓ All imports are valid');
    } else {
      console.error('✗ Import validation failed:');
      for (const error of errors) {
        console.error(`  - ${error}`);
      }
      process.exit(1);
    }
  } else {
    console.error('Usage: update-imports.ts <command> [options]');
    console.error('Commands:');
    console.error('  find <rootDir> <targetModule>     - Find all files importing from a module');
    console.error('  update <rootDir> <oldPath> <newPath> - Update imports from old to new path');
    console.error('  validate <rootDir>                - Validate all imports can be resolved');
    process.exit(1);
  }
}
