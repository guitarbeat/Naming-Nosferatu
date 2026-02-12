#!/usr/bin/env node
/**
 * Test Runner for Component Consolidation
 * 
 * Provides utilities for running tests and verifying functionality
 * during component consolidation.
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface TestResult {
  success: boolean;
  output: string;
  errors: string[];
  duration: number;
}

interface ConsolidationTestSuite {
  preConsolidation: TestResult | null;
  postConsolidation: TestResult | null;
  buildCheck: TestResult | null;
  typeCheck: TestResult | null;
}

/**
 * Runs TypeScript type checking
 */
export function runTypeCheck(rootDir: string = '.'): TestResult {
  const startTime = Date.now();
  const result: TestResult = {
    success: false,
    output: '',
    errors: [],
    duration: 0,
  };

  try {
    const output = execSync('pnpm run lint:types', {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    result.success = true;
    result.output = output;
  } catch (error: any) {
    result.success = false;
    result.output = error.stdout || '';
    result.errors.push(error.stderr || error.message);
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Runs the build process
 */
export function runBuild(rootDir: string = '.', mode: 'production' | 'development' = 'development'): TestResult {
  const startTime = Date.now();
  const result: TestResult = {
    success: false,
    output: '',
    errors: [],
    duration: 0,
  };

  try {
    const command = mode === 'development' ? 'pnpm run build:dev' : 'pnpm run build';
    const output = execSync(command, {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    result.success = true;
    result.output = output;
  } catch (error: any) {
    result.success = false;
    result.output = error.stdout || '';
    result.errors.push(error.stderr || error.message);
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Runs linting
 */
export function runLint(rootDir: string = '.'): TestResult {
  const startTime = Date.now();
  const result: TestResult = {
    success: false,
    output: '',
    errors: [],
    duration: 0,
  };

  try {
    const output = execSync('pnpm run lint:full', {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    result.success = true;
    result.output = output;
  } catch (error: any) {
    result.success = false;
    result.output = error.stdout || '';
    result.errors.push(error.stderr || error.message);
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Checks for unused files after consolidation
 */
export function findUnusedFiles(rootDir: string, consolidatedFiles: string[]): string[] {
  const unusedFiles: string[] = [];

  for (const file of consolidatedFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      // File still exists - check if it's referenced anywhere
      const isReferenced = checkFileReferences(rootDir, file);
      if (!isReferenced) {
        unusedFiles.push(file);
      }
    }
  }

  return unusedFiles;
}

/**
 * Checks if a file is referenced in the codebase
 */
function checkFileReferences(rootDir: string, targetFile: string): boolean {
  try {
    // Use grep to search for references
    const fileName = path.basename(targetFile, path.extname(targetFile));
    const output = execSync(
      `grep -r "${fileName}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "${rootDir}/source" || true`,
      { encoding: 'utf-8' }
    );

    return output.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Runs a complete consolidation test suite
 */
export async function runConsolidationTestSuite(
  rootDir: string = '.',
  options: {
    skipBuild?: boolean;
    skipTypeCheck?: boolean;
  } = {}
): Promise<ConsolidationTestSuite> {
  const suite: ConsolidationTestSuite = {
    preConsolidation: null,
    postConsolidation: null,
    buildCheck: null,
    typeCheck: null,
  };

  console.log('Running consolidation test suite...\n');

  // Type check
  if (!options.skipTypeCheck) {
    console.log('1. Running type check...');
    suite.typeCheck = runTypeCheck(rootDir);
    if (suite.typeCheck.success) {
      console.log(`   ✓ Type check passed (${suite.typeCheck.duration}ms)\n`);
    } else {
      console.log(`   ✗ Type check failed (${suite.typeCheck.duration}ms)`);
      console.log(`   Errors: ${suite.typeCheck.errors.join('\n   ')}\n`);
    }
  }

  // Build check
  if (!options.skipBuild) {
    console.log('2. Running build...');
    suite.buildCheck = runBuild(rootDir, 'development');
    if (suite.buildCheck.success) {
      console.log(`   ✓ Build passed (${suite.buildCheck.duration}ms)\n`);
    } else {
      console.log(`   ✗ Build failed (${suite.buildCheck.duration}ms)`);
      console.log(`   Errors: ${suite.buildCheck.errors.join('\n   ')}\n`);
    }
  }

  return suite;
}

/**
 * Generates a test report
 */
export function generateTestReport(suite: ConsolidationTestSuite): string {
  const lines: string[] = [];

  lines.push('# Consolidation Test Report\n');
  lines.push(`Generated: ${new Date().toISOString()}\n`);

  if (suite.typeCheck) {
    lines.push('## Type Check');
    lines.push(`Status: ${suite.typeCheck.success ? '✓ PASSED' : '✗ FAILED'}`);
    lines.push(`Duration: ${suite.typeCheck.duration}ms`);
    if (!suite.typeCheck.success) {
      lines.push('\nErrors:');
      for (const error of suite.typeCheck.errors) {
        lines.push(`- ${error}`);
      }
    }
    lines.push('');
  }

  if (suite.buildCheck) {
    lines.push('## Build Check');
    lines.push(`Status: ${suite.buildCheck.success ? '✓ PASSED' : '✗ FAILED'}`);
    lines.push(`Duration: ${suite.buildCheck.duration}ms`);
    if (!suite.buildCheck.success) {
      lines.push('\nErrors:');
      for (const error of suite.buildCheck.errors) {
        lines.push(`- ${error}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Verifies no broken imports exist
 */
export function verifyNoBreakingImports(rootDir: string = '.'): TestResult {
  const startTime = Date.now();
  const result: TestResult = {
    success: false,
    output: '',
    errors: [],
    duration: 0,
  };

  try {
    // Run TypeScript compiler to check for module resolution errors
    const output = execSync('pnpm exec tsc --noEmit', {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    result.success = true;
    result.output = output;
  } catch (error: any) {
    const errorOutput = error.stderr || error.stdout || error.message;
    
    // Check if errors are import-related
    if (errorOutput.includes('Cannot find module') || errorOutput.includes('Module not found')) {
      result.success = false;
      result.errors.push('Found broken imports');
      result.output = errorOutput;
    } else {
      // Other TypeScript errors are not import-related
      result.success = true;
      result.output = errorOutput;
    }
  }

  result.duration = Date.now() - startTime;
  return result;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const rootDir = process.argv[3] || '.';

  if (command === 'type-check') {
    console.log('Running type check...\n');
    const result = runTypeCheck(rootDir);
    
    if (result.success) {
      console.log('✓ Type check passed');
      process.exit(0);
    } else {
      console.error('✗ Type check failed:');
      for (const error of result.errors) {
        console.error(`  ${error}`);
      }
      process.exit(1);
    }
  } else if (command === 'build') {
    console.log('Running build...\n');
    const result = runBuild(rootDir);
    
    if (result.success) {
      console.log('✓ Build passed');
      process.exit(0);
    } else {
      console.error('✗ Build failed:');
      for (const error of result.errors) {
        console.error(`  ${error}`);
      }
      process.exit(1);
    }
  } else if (command === 'verify-imports') {
    console.log('Verifying imports...\n');
    const result = verifyNoBreakingImports(rootDir);
    
    if (result.success) {
      console.log('✓ No broken imports found');
      process.exit(0);
    } else {
      console.error('✗ Found broken imports:');
      console.error(result.output);
      process.exit(1);
    }
  } else if (command === 'full') {
    console.log('Running full consolidation test suite...\n');
    
    runConsolidationTestSuite(rootDir).then(suite => {
      const report = generateTestReport(suite);
      console.log(report);
      
      // Write report to file
      const reportPath = path.join(rootDir, 'consolidation-test-report.md');
      fs.writeFileSync(reportPath, report);
      console.log(`\nReport written to: ${reportPath}`);
      
      // Exit with error if any test failed
      const allPassed = 
        (!suite.typeCheck || suite.typeCheck.success) &&
        (!suite.buildCheck || suite.buildCheck.success);
      
      process.exit(allPassed ? 0 : 1);
    });
  } else {
    console.error('Usage: test-runner.ts <command> [rootDir]');
    console.error('Commands:');
    console.error('  type-check      - Run TypeScript type checking');
    console.error('  build           - Run build process');
    console.error('  verify-imports  - Verify no broken imports');
    console.error('  full            - Run complete test suite');
    process.exit(1);
  }
}
