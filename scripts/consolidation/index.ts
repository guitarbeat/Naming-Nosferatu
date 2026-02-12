#!/usr/bin/env node
/**
 * Component Consolidation Utility
 * 
 * Main entry point for component consolidation operations.
 * Provides a unified interface for analyzing, updating, and testing
 * component consolidations.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { analyzeComponents, generateReport } from './analyze-dependencies.js';
import { 
  findImportReferences, 
  batchUpdateImports, 
  validateImports,
  generateUpdatePlan 
} from './update-imports.js';
import { 
  runConsolidationTestSuite, 
  generateTestReport,
  verifyNoBreakingImports 
} from './test-runner.js';

interface ConsolidationPlan {
  id: string;
  type: 'remove' | 'merge' | 'standardize';
  sourceComponents: string[];
  targetComponent: string;
  description: string;
}

interface ConsolidationResult {
  success: boolean;
  plan: ConsolidationPlan;
  filesUpdated: number;
  errors: string[];
  testResults?: any;
}

/**
 * Executes a consolidation plan
 */
export async function executeConsolidation(
  plan: ConsolidationPlan,
  rootDir: string = '.',
  options: {
    dryRun?: boolean;
    skipTests?: boolean;
  } = {}
): Promise<ConsolidationResult> {
  const result: ConsolidationResult = {
    success: false,
    plan,
    filesUpdated: 0,
    errors: [],
  };

  console.log(`\nExecuting consolidation: ${plan.id}`);
  console.log(`Type: ${plan.type}`);
  console.log(`Description: ${plan.description}\n`);

  if (options.dryRun) {
    console.log('DRY RUN MODE - No changes will be made\n');
  }

  try {
    // Step 1: Analyze current state
    console.log('1. Analyzing components...');
    const analysis = analyzeComponents(path.join(rootDir, 'source'));
    console.log(`   Found ${analysis.components.size} components\n`);

    // Step 2: Generate update plan
    console.log('2. Generating import update plan...');
    const consolidationMap = new Map<string, string>();
    for (const source of plan.sourceComponents) {
      consolidationMap.set(source, plan.targetComponent);
    }
    const updatePlan = generateUpdatePlan(path.join(rootDir, 'source'), consolidationMap);
    console.log(`   ${updatePlan.length} files need updates\n`);

    if (options.dryRun) {
      console.log('   Update plan:');
      for (const { file, updates } of updatePlan) {
        console.log(`   - ${file}`);
        for (const update of updates) {
          console.log(`     ${update.oldImport} → ${update.newImport}`);
        }
      }
      result.success = true;
      return result;
    }

    // Step 3: Update imports
    console.log('3. Updating imports...');
    for (const source of plan.sourceComponents) {
      const updateResult = batchUpdateImports(
        path.join(rootDir, 'source'),
        source,
        plan.targetComponent
      );
      
      if (!updateResult.success) {
        result.errors.push(...updateResult.errors);
      } else {
        result.filesUpdated += updateResult.filesUpdated;
      }
    }
    console.log(`   Updated ${result.filesUpdated} files\n`);

    // Step 4: Verify imports
    console.log('4. Verifying imports...');
    const importValidation = verifyNoBreakingImports(rootDir);
    if (!importValidation.success) {
      result.errors.push('Import verification failed');
      console.log('   ✗ Import verification failed\n');
    } else {
      console.log('   ✓ All imports valid\n');
    }

    // Step 5: Run tests (if not skipped)
    if (!options.skipTests) {
      console.log('5. Running tests...');
      const testSuite = await runConsolidationTestSuite(rootDir);
      result.testResults = testSuite;
      
      const allTestsPassed = 
        (!testSuite.typeCheck || testSuite.typeCheck.success) &&
        (!testSuite.buildCheck || testSuite.buildCheck.success);
      
      if (allTestsPassed) {
        console.log('   ✓ All tests passed\n');
      } else {
        result.errors.push('Some tests failed');
        console.log('   ✗ Some tests failed\n');
      }
    }

    // Step 6: Remove old files (if type is 'remove')
    if (plan.type === 'remove') {
      console.log('6. Removing old component files...');
      for (const source of plan.sourceComponents) {
        const filePath = path.join(rootDir, 'source', source);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`   Removed: ${source}`);
        }
      }
      console.log('');
    }

    result.success = result.errors.length === 0;

    if (result.success) {
      console.log('✓ Consolidation completed successfully\n');
    } else {
      console.log('✗ Consolidation completed with errors:\n');
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
    }

  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
    console.error('✗ Consolidation failed:', error);
  }

  return result;
}

/**
 * Loads a consolidation plan from a JSON file
 */
export function loadConsolidationPlan(planPath: string): ConsolidationPlan {
  const content = fs.readFileSync(planPath, 'utf-8');
  return JSON.parse(content) as ConsolidationPlan;
}

/**
 * Saves a consolidation plan to a JSON file
 */
export function saveConsolidationPlan(plan: ConsolidationPlan, outputPath: string): void {
  const content = JSON.stringify(plan, null, 2);
  fs.writeFileSync(outputPath, content, 'utf-8');
}

/**
 * Creates a backup of files before consolidation
 */
export function createBackup(files: string[], backupDir: string): void {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  for (const file of files) {
    if (fs.existsSync(file)) {
      const backupPath = path.join(backupDir, path.basename(file));
      fs.copyFileSync(file, backupPath);
    }
  }
}

/**
 * Restores files from backup
 */
export function restoreBackup(backupDir: string, targetDir: string): void {
  if (!fs.existsSync(backupDir)) {
    throw new Error(`Backup directory not found: ${backupDir}`);
  }

  const files = fs.readdirSync(backupDir);
  for (const file of files) {
    const backupPath = path.join(backupDir, file);
    const targetPath = path.join(targetDir, file);
    fs.copyFileSync(backupPath, targetPath);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (command === 'analyze') {
    const rootDir = process.argv[3] || './source';
    console.log(`Analyzing components in: ${rootDir}\n`);
    
    const result = analyzeComponents(rootDir);
    const report = generateReport(result);
    
    console.log(report);
    
    const reportPath = path.join(process.cwd(), 'component-analysis-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\nReport written to: ${reportPath}`);
    
  } else if (command === 'execute') {
    const planPath = process.argv[3];
    const rootDir = process.argv[4] || '.';
    const dryRun = process.argv.includes('--dry-run');
    const skipTests = process.argv.includes('--skip-tests');
    
    if (!planPath) {
      console.error('Usage: consolidation.ts execute <planPath> [rootDir] [--dry-run] [--skip-tests]');
      process.exit(1);
    }
    
    const plan = loadConsolidationPlan(planPath);
    
    executeConsolidation(plan, rootDir, { dryRun, skipTests }).then(result => {
      if (result.success) {
        console.log('\n✓ Consolidation completed successfully');
        process.exit(0);
      } else {
        console.error('\n✗ Consolidation failed');
        process.exit(1);
      }
    });
    
  } else if (command === 'verify') {
    const rootDir = process.argv[3] || '.';
    
    console.log('Verifying consolidation...\n');
    
    console.log('1. Checking imports...');
    const importCheck = verifyNoBreakingImports(rootDir);
    if (importCheck.success) {
      console.log('   ✓ No broken imports\n');
    } else {
      console.log('   ✗ Found broken imports\n');
      console.log(importCheck.output);
    }
    
    console.log('2. Validating TypeScript...');
    const validation = validateImports(path.join(rootDir, 'source'));
    if (validation.valid) {
      console.log('   ✓ All imports valid\n');
    } else {
      console.log('   ✗ Import validation failed\n');
      for (const error of validation.errors) {
        console.log(`   - ${error}`);
      }
    }
    
    const allValid = importCheck.success && validation.valid;
    process.exit(allValid ? 0 : 1);
    
  } else {
    console.error('Usage: consolidation.ts <command> [options]');
    console.error('Commands:');
    console.error('  analyze [rootDir]                           - Analyze components');
    console.error('  execute <planPath> [rootDir] [--dry-run]    - Execute consolidation plan');
    console.error('  verify [rootDir]                            - Verify consolidation');
    process.exit(1);
  }
}
