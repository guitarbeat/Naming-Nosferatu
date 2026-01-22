/**
 * @file cssRefactorAnalysis.ts
 * @description Main analysis runner for CSS DRY refactoring project
 * 
 * This module orchestrates the analysis and validation infrastructure:
 * - Runs CSS analysis to identify patterns
 * - Creates backups for safe refactoring
 * - Sets up visual regression testing
 * - Generates comprehensive reports
 */

import { CSSAnalyzer, type AnalysisResult, generateAnalysisReport } from './cssAnalysis.js';
import { VisualRegressionTester, type RegressionTestResult, generateVisualReport } from './visualRegression.js';
import { BackupSystem, type RestorePoint } from './backupSystem.js';

export interface RefactorAnalysisConfig {
    stylesPath?: string;
    backupConfig?: {
        maxBackups?: number;
        autoBackup?: boolean;
    };
    visualTesting?: {
        captureBaseline?: boolean;
        runRegression?: boolean;
    };
    outputDir?: string;
}

export interface RefactorAnalysisResult {
    analysisId: string;
    timestamp: string;
    cssAnalysis: AnalysisResult;
    visualRegression?: RegressionTestResult;
    backupId: string;
    reports: {
        cssAnalysisReport: string;
        visualRegressionReport?: string;
        backupReport: string;
        summaryReport: string;
    };
    recommendations: string[];
    nextSteps: string[];
}

/**
 * Main CSS Refactor Analysis Runner
 */
export class CSSRefactorAnalysis {
    private config: Required<RefactorAnalysisConfig>;
    private cssAnalyzer: CSSAnalyzer;
    private visualTester: VisualRegressionTester;
    private backupSystem: BackupSystem;

    constructor(config: RefactorAnalysisConfig = {}) {
        this.config = {
            stylesPath: config.stylesPath || 'source/shared/styles',
            backupConfig: {
                maxBackups: 10,
                autoBackup: true,
                ...config.backupConfig
            },
            visualTesting: {
                captureBaseline: true,
                runRegression: false,
                ...config.visualTesting
            },
            outputDir: config.outputDir || '.kiro/specs/css-dry-refactor/analysis'
        };

        this.cssAnalyzer = new CSSAnalyzer(this.config.stylesPath);
        this.visualTester = new VisualRegressionTester();
        this.backupSystem = new BackupSystem({
            backupDir: '.kiro/specs/css-dry-refactor/backups',
            ...this.config.backupConfig
        });
    }

    /**
     * Run complete analysis and setup infrastructure
     */
    async runCompleteAnalysis(): Promise<RefactorAnalysisResult> {
        const analysisId = `analysis-${Date.now()}`;
        const timestamp = new Date().toISOString();

        console.log('🚀 Starting CSS DRY Refactoring Analysis...\n');

        try {
            // Step 1: Initialize all systems
            console.log('📋 Step 1: Initializing analysis infrastructure...');
            await this.initializeSystems();

            // Step 2: Create backup
            console.log('\n📦 Step 2: Creating backup of current CSS files...');
            const backupId = await this.createInitialBackup();

            // Step 3: Run CSS analysis
            console.log('\n🔍 Step 3: Analyzing CSS files for patterns and issues...');
            const cssAnalysis = await this.runCSSAnalysis();

            // Step 4: Visual regression setup
            console.log('\n📸 Step 4: Setting up visual regression testing...');
            let visualRegression: RegressionTestResult | undefined;
            if (this.config.visualTesting.captureBaseline) {
                await this.setupVisualTesting();
            }
            if (this.config.visualTesting.runRegression) {
                visualRegression = await this.runVisualRegression();
            }

            // Step 5: Generate reports
            console.log('\n📊 Step 5: Generating analysis reports...');
            const reports = await this.generateReports(cssAnalysis, visualRegression, backupId);

            // Step 6: Generate recommendations
            console.log('\n💡 Step 6: Generating recommendations...');
            const recommendations = this.generateRecommendations(cssAnalysis);
            const nextSteps = this.generateNextSteps(cssAnalysis, visualRegression);

            const result: RefactorAnalysisResult = {
                analysisId,
                timestamp,
                cssAnalysis,
                visualRegression,
                backupId,
                reports,
                recommendations,
                nextSteps
            };

            console.log('\n✅ Analysis complete! Summary:');
            console.log(`   Analysis ID: ${analysisId}`);
            console.log(`   Backup ID: ${backupId}`);
            console.log(`   CSS Issues Found: ${cssAnalysis.duplicatePatterns.length + cssAnalysis.hardcodedValues.length}`);
            console.log(`   Recommendations: ${recommendations.length}`);

            if (visualRegression) {
                console.log(`   Visual Tests: ${visualRegression.passedComponents}/${visualRegression.totalComponents} passed`);
            }

            return result;
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            throw error;
        }
    }

    /**
     * Initialize all analysis systems
     */
    private async initializeSystems(): Promise<void> {
        await Promise.all([
            this.backupSystem.initialize(),
            this.visualTester.initializeDirectories()
        ]);
        console.log('✅ All systems initialized');
    }

    /**
     * Create initial backup before analysis
     */
    private async createInitialBackup(): Promise<string> {
        const backupId = await this.backupSystem.createBackup(
            'Pre-analysis backup - CSS files before DRY refactoring',
            'pre-analysis',
            ['initial', 'analysis']
        );
        return backupId;
    }

    /**
     * Run CSS analysis
     */
    private async runCSSAnalysis(): Promise<AnalysisResult> {
        const result = await this.cssAnalyzer.analyze();

        console.log(`   Found ${result.duplicatePatterns.length} duplicate patterns`);
        console.log(`   Found ${result.hardcodedValues.length} hardcoded values`);
        console.log(`   Found ${result.unusedSelectors.length} potentially unused selectors`);
        console.log(`   Identified ${result.optimizationOpportunities.length} optimization opportunities`);

        return result;
    }

    /**
     * Setup visual regression testing
     */
    private async setupVisualTesting(): Promise<void> {
        const screenshots = await this.visualTester.captureBaseline();
        console.log(`   Captured ${screenshots.length} baseline screenshots`);
    }

    /**
     * Run visual regression testing
     */
    private async runVisualRegression(): Promise<RegressionTestResult> {
        const result = await this.visualTester.runVisualRegressionTest();
        console.log(`   Visual regression test completed: ${result.passedComponents}/${result.totalComponents} passed`);
        return result;
    }

    /**
     * Generate all reports
     */
    private async generateReports(
        cssAnalysis: AnalysisResult,
        visualRegression?: RegressionTestResult,
        backupId?: string
    ): Promise<RefactorAnalysisResult['reports']> {

        const cssAnalysisReport = generateAnalysisReport(cssAnalysis);
        const visualRegressionReport = visualRegression ? generateVisualReport(visualRegression) : undefined;
        const backupReport = this.backupSystem.generateBackupReport();
        const summaryReport = this.generateSummaryReport(cssAnalysis, visualRegression, backupId);

        return {
            cssAnalysisReport,
            visualRegressionReport,
            backupReport,
            summaryReport
        };
    }

    /**
     * Generate recommendations based on analysis
     */
    private generateRecommendations(analysis: AnalysisResult): string[] {
        const recommendations: string[] = [];

        // Duplicate pattern recommendations
        if (analysis.duplicatePatterns.length > 0) {
            recommendations.push(
                `🔄 Consolidate ${analysis.duplicatePatterns.length} duplicate CSS patterns into utility classes`
            );

            const highImpactPatterns = analysis.duplicatePatterns.filter(p => p.occurrences.length >= 5);
            if (highImpactPatterns.length > 0) {
                recommendations.push(
                    `⚡ Priority: Focus on ${highImpactPatterns.length} patterns with 5+ occurrences for maximum impact`
                );
            }
        }

        // Hardcoded value recommendations
        if (analysis.hardcodedValues.length > 0) {
            const categories = [...new Set(analysis.hardcodedValues.map(hv => hv.category))];
            recommendations.push(
                `🎨 Convert ${analysis.hardcodedValues.length} hardcoded values to design tokens (${categories.join(', ')})`
            );
        }

        // Unused selector recommendations
        if (analysis.unusedSelectors.length > 0) {
            recommendations.push(
                `🧹 Review and potentially remove ${analysis.unusedSelectors.length} unused CSS selectors`
            );
        }

        // Optimization recommendations
        analysis.optimizationOpportunities.forEach(opp => {
            if (opp.impact === 'high') {
                recommendations.push(`🚀 ${opp.description} (High Impact)`);
            }
        });

        // General recommendations
        recommendations.push(
            '📋 Start with design token enhancement to establish consistent foundation',
            '🔧 Generate utility classes for common patterns to reduce duplication',
            '🎯 Focus on component consolidation for better maintainability',
            '✅ Run visual regression tests after each major change'
        );

        return recommendations;
    }

    /**
     * Generate next steps
     */
    private generateNextSteps(analysis: AnalysisResult, visualRegression?: RegressionTestResult): string[] {
        const steps: string[] = [];

        steps.push(
            '1. Review the CSS analysis report to understand current duplication patterns',
            '2. Examine hardcoded values and plan design token extraction strategy',
            '3. Start with Task 2.1: Extract hardcoded values from LoginScene.module.css',
            '4. Continue with Task 2.2: Consolidate duplicate color definitions',
            '5. Run visual regression tests after each task completion'
        );

        if (analysis.duplicatePatterns.length > 10) {
            steps.push('6. Consider breaking down component consolidation into smaller phases');
        }

        if (visualRegression && visualRegression.failedComponents > 0) {
            steps.push('⚠️  Address visual regression failures before proceeding with refactoring');
        }

        steps.push(
            '7. Create phase backups before starting each major refactoring task',
            '8. Use the backup system to rollback if any issues are detected',
            '9. Update documentation as you consolidate patterns'
        );

        return steps;
    }

    /**
     * Generate summary report
     */
    private generateSummaryReport(
        analysis: AnalysisResult,
        visualRegression?: RegressionTestResult,
        backupId?: string
    ): string {
        const timestamp = new Date().toLocaleString();

        let report = `# CSS DRY Refactoring - Analysis Summary\n\n`;
        report += `**Generated:** ${timestamp}\n`;
        report += `**Backup ID:** ${backupId || 'N/A'}\n\n`;

        report += `## 🎯 Key Findings\n\n`;
        report += `- **Duplicate Patterns:** ${analysis.duplicatePatterns.length} found\n`;
        report += `- **Hardcoded Values:** ${analysis.hardcodedValues.length} found\n`;
        report += `- **Unused Selectors:** ${analysis.unusedSelectors.length} potentially unused\n`;
        report += `- **Optimization Opportunities:** ${analysis.optimizationOpportunities.length} identified\n`;
        report += `- **Potential Savings:** ${analysis.summary.potentialSavings}\n\n`;

        if (visualRegression) {
            report += `## 📸 Visual Regression Status\n\n`;
            report += `- **Total Components:** ${visualRegression.totalComponents}\n`;
            report += `- **Passed:** ${visualRegression.passedComponents}\n`;
            report += `- **Failed:** ${visualRegression.failedComponents}\n`;
            report += `- **Overall Similarity:** ${(visualRegression.summary.overallSimilarity * 100).toFixed(1)}%\n\n`;
        }

        report += `## 🚀 Ready to Start\n\n`;
        report += `The analysis infrastructure is now set up and ready for CSS refactoring:\n\n`;
        report += `1. ✅ **Backup System** - Initial backup created\n`;
        report += `2. ✅ **CSS Analysis** - Patterns and issues identified\n`;
        report += `3. ✅ **Visual Testing** - Baseline captured\n`;
        report += `4. ✅ **Reports Generated** - Detailed analysis available\n\n`;

        report += `## 📋 Next Actions\n\n`;
        report += `You can now proceed with the CSS refactoring tasks:\n\n`;
        report += `- Open the tasks.md file in the spec\n`;
        report += `- Start with Task 2.1: Extract hardcoded values\n`;
        report += `- Use the backup system for safe rollback if needed\n`;
        report += `- Run visual regression tests after major changes\n\n`;

        report += `## 📊 Detailed Reports\n\n`;
        report += `- **CSS Analysis Report:** Detailed breakdown of patterns and issues\n`;
        report += `- **Backup Report:** Backup history and restore points\n`;
        if (visualRegression) {
            report += `- **Visual Regression Report:** Component-by-component visual comparison\n`;
        }

        return report;
    }
}

/**
 * Utility functions
 */
export async function runCSSRefactorAnalysis(config?: RefactorAnalysisConfig): Promise<RefactorAnalysisResult> {
    const analysis = new CSSRefactorAnalysis(config);
    return await analysis.runCompleteAnalysis();
}

export async function quickAnalysis(): Promise<AnalysisResult> {
    const analyzer = new CSSAnalyzer();
    return await analyzer.analyze();
}

export async function setupInfrastructure(): Promise<{
    backupId: string;
    baselineScreenshots: number;
}> {
    console.log('🔧 Setting up CSS refactoring infrastructure...\n');

    // Initialize backup system
    const backupSystem = new BackupSystem();
    await backupSystem.initialize();

    // Create initial backup
    const backupId = await backupSystem.createBackup(
        'Initial setup - CSS files before refactoring infrastructure',
        'setup',
        ['initial', 'infrastructure']
    );

    // Setup visual testing
    const visualTester = new VisualRegressionTester();
    await visualTester.initializeDirectories();
    const screenshots = await visualTester.captureBaseline();

    console.log('✅ Infrastructure setup complete!');
    console.log(`   Backup ID: ${backupId}`);
    console.log(`   Baseline Screenshots: ${screenshots.length}`);

    return {
        backupId,
        baselineScreenshots: screenshots.length
    };
}