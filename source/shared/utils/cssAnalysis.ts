/**
 * @file cssAnalysis.ts
 * @description CSS Analysis utilities for identifying duplication patterns and optimization opportunities
 * 
 * This module provides tools to analyze CSS files for:
 * - Duplicate rules and patterns
 * - Hardcoded values that could be tokenized
 * - Unused selectors
 * - Optimization opportunities
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

// Types for CSS analysis
export interface CSSProperty {
    property: string;
    value: string;
    important: boolean;
}

export interface CSSRule {
    selector: string;
    properties: CSSProperty[];
    file: string;
    lineNumber: number;
}

export interface DuplicatePattern {
    pattern: CSSProperty[];
    occurrences: Array<{
        selector: string;
        file: string;
        lineNumber: number;
    }>;
    consolidationOpportunity: string;
}

export interface HardcodedValue {
    property: string;
    value: string;
    location: {
        file: string;
        selector: string;
        lineNumber: number;
    };
    suggestedToken: string;
    category: 'spacing' | 'color' | 'typography' | 'border-radius' | 'z-index';
}

export interface AnalysisResult {
    duplicatePatterns: DuplicatePattern[];
    hardcodedValues: HardcodedValue[];
    unusedSelectors: string[];
    optimizationOpportunities: OptimizationOpportunity[];
    summary: AnalysisSummary;
}

export interface OptimizationOpportunity {
    type: 'merge-rules' | 'extract-utility' | 'consolidate-values' | 'remove-unused';
    description: string;
    impact: 'high' | 'medium' | 'low';
    files: string[];
    estimatedSavings: string;
}

export interface AnalysisSummary {
    totalFiles: number;
    totalRules: number;
    duplicateRulesCount: number;
    hardcodedValuesCount: number;
    potentialSavings: string;
}

/**
 * CSS Analysis Engine
 */
export class CSSAnalyzer {
    private cssFiles: string[] = [];
    private parsedRules: CSSRule[] = [];

    constructor(private stylesPath: string = 'source/shared/styles') { }

    /**
     * Initialize analyzer with CSS files
     */
    async initialize(): Promise<void> {
        this.cssFiles = [
            'design-tokens.css',
            'components.css',
            'utilities.css',
            'layout.css',
            'animations.css',
            'interactions.css',
            'themes.css',
            'colors.css',
            'analysis-mode.css',
            'app-layout.css',
            'gallery.css',
            'responsive-mobile.css'
        ];
    }

    /**
     * Parse CSS file and extract rules
     */
    private async parseCSSFile(filename: string): Promise<CSSRule[]> {
        try {
            const filePath = join(this.stylesPath, filename);
            const content = await readFile(filePath, 'utf-8');
            return this.parseCSS(content, filename);
        } catch (error) {
            console.warn(`Could not parse CSS file ${filename}:`, error);
            return [];
        }
    }

    /**
     * Simple CSS parser to extract rules and properties
     */
    private parseCSS(content: string, filename: string): CSSRule[] {
        const rules: CSSRule[] = [];
        const lines = content.split('\n');
        let currentRule: Partial<CSSRule> | null = null;
        let braceDepth = 0;
        let inComment = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // Skip empty lines and comments
            if (!line || line.startsWith('/*') || line.startsWith('*') || line.startsWith('//')) {
                if (line.startsWith('/*')) inComment = true;
                if (line.endsWith('*/')) inComment = false;
                continue;
            }
            if (inComment) continue;

            // Skip @import, @media, @keyframes for now (simplified parser)
            if (line.startsWith('@')) continue;

            // Detect selector (line ending with {)
            if (line.includes('{') && !currentRule) {
                const selector = line.replace('{', '').trim();
                if (selector) {
                    currentRule = {
                        selector,
                        properties: [],
                        file: filename,
                        lineNumber
                    };
                    braceDepth++;
                }
            }
            // Detect property inside rule
            else if (currentRule && line.includes(':') && !line.includes('{')) {
                const colonIndex = line.indexOf(':');
                const property = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).replace(';', '').trim();
                const important = value.includes('!important');
                if (important) {
                    value = value.replace('!important', '').trim();
                }

                if (property && value) {
                    currentRule.properties!.push({
                        property,
                        value,
                        important
                    });
                }
            }
            // Detect end of rule
            else if (line.includes('}') && currentRule) {
                braceDepth--;
                if (braceDepth === 0) {
                    rules.push(currentRule as CSSRule);
                    currentRule = null;
                }
            }
        }

        return rules;
    }

    /**
     * Analyze all CSS files for patterns and issues
     */
    async analyze(): Promise<AnalysisResult> {
        await this.initialize();

        // Parse all CSS files
        this.parsedRules = [];
        for (const file of this.cssFiles) {
            const rules = await this.parseCSSFile(file);
            this.parsedRules.push(...rules);
        }

        // Run analysis
        const duplicatePatterns = this.findDuplicatePatterns();
        const hardcodedValues = this.findHardcodedValues();
        const unusedSelectors = this.findUnusedSelectors();
        const optimizationOpportunities = this.findOptimizationOpportunities();

        const summary: AnalysisSummary = {
            totalFiles: this.cssFiles.length,
            totalRules: this.parsedRules.length,
            duplicateRulesCount: duplicatePatterns.length,
            hardcodedValuesCount: hardcodedValues.length,
            potentialSavings: this.calculatePotentialSavings(duplicatePatterns, hardcodedValues)
        };

        return {
            duplicatePatterns,
            hardcodedValues,
            unusedSelectors,
            optimizationOpportunities,
            summary
        };
    }

    /**
     * Find duplicate CSS patterns across files
     */
    private findDuplicatePatterns(): DuplicatePattern[] {
        const patterns: Map<string, DuplicatePattern> = new Map();

        // Group rules by property combinations
        for (const rule of this.parsedRules) {
            if (rule.properties.length === 0) continue;

            // Create pattern key from sorted properties
            const sortedProps = rule.properties
                .map(p => `${p.property}:${p.value}`)
                .sort()
                .join(';');

            if (!patterns.has(sortedProps)) {
                patterns.set(sortedProps, {
                    pattern: rule.properties,
                    occurrences: [],
                    consolidationOpportunity: ''
                });
            }

            patterns.get(sortedProps)!.occurrences.push({
                selector: rule.selector,
                file: rule.file,
                lineNumber: rule.lineNumber
            });
        }

        // Filter to only patterns with multiple occurrences
        return Array.from(patterns.values())
            .filter(pattern => pattern.occurrences.length > 1)
            .map(pattern => ({
                ...pattern,
                consolidationOpportunity: this.suggestConsolidation(pattern)
            }));
    }

    /**
     * Find hardcoded values that could be design tokens
     */
    private findHardcodedValues(): HardcodedValue[] {
        const hardcodedValues: HardcodedValue[] = [];

        // Common hardcoded patterns to look for
        const patterns = {
            spacing: /^(\d+(?:\.\d+)?)(px|rem|em)$/,
            color: /^#[0-9a-fA-F]{3,8}$|^rgb\(|^rgba\(|^hsl\(|^hsla\(/,
            borderRadius: /^(\d+(?:\.\d+)?)(px|rem|em)$/,
            zIndex: /^\d+$/
        };

        for (const rule of this.parsedRules) {
            for (const prop of rule.properties) {
                // Skip if already using CSS custom properties
                if (prop.value.includes('var(--')) continue;

                let category: HardcodedValue['category'] | null = null;
                let suggestedToken = '';

                // Check for spacing values
                if (['margin', 'padding', 'gap', 'top', 'left', 'right', 'bottom'].some(p => prop.property.includes(p))) {
                    if (patterns.spacing.test(prop.value)) {
                        category = 'spacing';
                        suggestedToken = this.suggestSpacingToken(prop.value);
                    }
                }
                // Check for color values
                else if (['color', 'background', 'border-color', 'box-shadow'].some(p => prop.property.includes(p))) {
                    if (patterns.color.test(prop.value)) {
                        category = 'color';
                        suggestedToken = this.suggestColorToken(prop.value);
                    }
                }
                // Check for border-radius
                else if (prop.property.includes('border-radius')) {
                    if (patterns.borderRadius.test(prop.value)) {
                        category = 'border-radius';
                        suggestedToken = this.suggestRadiusToken(prop.value);
                    }
                }
                // Check for z-index
                else if (prop.property === 'z-index') {
                    if (patterns.zIndex.test(prop.value)) {
                        category = 'z-index';
                        suggestedToken = this.suggestZIndexToken(prop.value);
                    }
                }

                if (category) {
                    hardcodedValues.push({
                        property: prop.property,
                        value: prop.value,
                        location: {
                            file: rule.file,
                            selector: rule.selector,
                            lineNumber: rule.lineNumber
                        },
                        suggestedToken,
                        category
                    });
                }
            }
        }

        return hardcodedValues;
    }

    /**
     * Find potentially unused selectors (simplified heuristic)
     */
    private findUnusedSelectors(): string[] {
        // This is a simplified implementation
        // In a real scenario, you'd need to scan the actual component files
        const potentiallyUnused: string[] = [];

        const selectorCounts = new Map<string, number>();

        for (const rule of this.parsedRules) {
            const count = selectorCounts.get(rule.selector) || 0;
            selectorCounts.set(rule.selector, count + 1);
        }

        // Look for selectors that appear only once and seem component-specific
        for (const [selector, count] of selectorCounts) {
            if (count === 1 && selector.includes('.') && !selector.includes(':')) {
                potentiallyUnused.push(selector);
            }
        }

        return potentiallyUnused.slice(0, 10); // Limit for demo
    }

    /**
     * Find optimization opportunities
     */
    private findOptimizationOpportunities(): OptimizationOpportunity[] {
        const opportunities: OptimizationOpportunity[] = [];

        // Look for merge opportunities
        const duplicatePatterns = this.findDuplicatePatterns();
        if (duplicatePatterns.length > 0) {
            opportunities.push({
                type: 'merge-rules',
                description: `Found ${duplicatePatterns.length} duplicate CSS patterns that could be consolidated`,
                impact: 'high',
                files: [...new Set(duplicatePatterns.flatMap(p => p.occurrences.map(o => o.file)))],
                estimatedSavings: `~${duplicatePatterns.length * 50} bytes`
            });
        }

        // Look for utility extraction opportunities
        const commonProperties = this.findCommonProperties();
        if (commonProperties.length > 0) {
            opportunities.push({
                type: 'extract-utility',
                description: `Found ${commonProperties.length} common property patterns suitable for utility classes`,
                impact: 'medium',
                files: this.cssFiles,
                estimatedSavings: `~${commonProperties.length * 30} bytes`
            });
        }

        return opportunities;
    }

    /**
     * Helper methods for token suggestions
     */
    private suggestSpacingToken(value: string): string {
        const numMatch = value.match(/^(\d+(?:\.\d+)?)/);
        if (!numMatch) return 'var(--space-custom)';

        const num = parseFloat(numMatch[1]);
        const unit = value.replace(numMatch[1], '');

        if (unit === 'rem') {
            const spaceNum = num * 4; // Convert rem to space scale (assuming 1rem = 16px, space-4 = 1rem)
            return `var(--space-${spaceNum})`;
        } else if (unit === 'px') {
            const spaceNum = num / 4; // Convert px to space scale
            return `var(--space-${spaceNum})`;
        }

        return 'var(--space-custom)';
    }

    private suggestColorToken(value: string): string {
        // Simple color token suggestion based on common patterns
        if (value.includes('#')) {
            return 'var(--color-custom)';
        }
        return 'var(--color-semantic)';
    }

    private suggestRadiusToken(value: string): string {
        const commonRadii = {
            '0': 'var(--radius-none)',
            '2px': 'var(--radius-xs)',
            '6px': 'var(--radius-sm)',
            '8px': 'var(--radius-md)',
            '12px': 'var(--radius-lg)',
            '16px': 'var(--radius-xl)',
            '24px': 'var(--radius-2xl)',
            '9999px': 'var(--radius-full)'
        };

        return commonRadii[value as keyof typeof commonRadii] || 'var(--radius-custom)';
    }

    private suggestZIndexToken(value: string): string {
        const num = parseInt(value);
        if (num >= 1000) return 'var(--z-modal)';
        if (num >= 500) return 'var(--z-toast)';
        if (num >= 100) return 'var(--z-sticky)';
        return 'var(--z-10)';
    }

    private suggestConsolidation(pattern: DuplicatePattern): string {
        const propNames = pattern.pattern.map(p => p.property).join(', ');
        return `Create utility class for: ${propNames}`;
    }

    private findCommonProperties(): Array<{ property: string; count: number }> {
        const propCounts = new Map<string, number>();

        for (const rule of this.parsedRules) {
            for (const prop of rule.properties) {
                const key = `${prop.property}:${prop.value}`;
                propCounts.set(key, (propCounts.get(key) || 0) + 1);
            }
        }

        return Array.from(propCounts.entries())
            .filter(([, count]) => count >= 3)
            .map(([key, count]) => ({ property: key, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    private calculatePotentialSavings(duplicates: DuplicatePattern[], hardcoded: HardcodedValue[]): string {
        const duplicateSavings = duplicates.length * 50; // Rough estimate
        const tokenSavings = hardcoded.length * 20; // Rough estimate
        return `~${duplicateSavings + tokenSavings} bytes`;
    }
}

/**
 * Utility function to run CSS analysis
 */
export async function analyzeCSSFiles(stylesPath?: string): Promise<AnalysisResult> {
    const analyzer = new CSSAnalyzer(stylesPath);
    return await analyzer.analyze();
}

/**
 * Generate analysis report
 */
export function generateAnalysisReport(result: AnalysisResult): string {
    const { summary, duplicatePatterns, hardcodedValues, optimizationOpportunities } = result;

    let report = `# CSS Analysis Report\n\n`;

    report += `## Summary\n`;
    report += `- Total Files: ${summary.totalFiles}\n`;
    report += `- Total Rules: ${summary.totalRules}\n`;
    report += `- Duplicate Patterns: ${summary.duplicateRulesCount}\n`;
    report += `- Hardcoded Values: ${summary.hardcodedValuesCount}\n`;
    report += `- Potential Savings: ${summary.potentialSavings}\n\n`;

    if (duplicatePatterns.length > 0) {
        report += `## Duplicate Patterns (Top 5)\n`;
        duplicatePatterns.slice(0, 5).forEach((pattern, i) => {
            report += `### ${i + 1}. ${pattern.consolidationOpportunity}\n`;
            report += `Occurrences: ${pattern.occurrences.length}\n`;
            pattern.occurrences.slice(0, 3).forEach(occ => {
                report += `- ${occ.file}:${occ.lineNumber} (${occ.selector})\n`;
            });
            report += `\n`;
        });
    }

    if (hardcodedValues.length > 0) {
        report += `## Hardcoded Values (Top 10)\n`;
        hardcodedValues.slice(0, 10).forEach((hv, i) => {
            report += `${i + 1}. \`${hv.property}: ${hv.value}\` → \`${hv.suggestedToken}\`\n`;
            report += `   Location: ${hv.location.file}:${hv.location.lineNumber}\n\n`;
        });
    }

    if (optimizationOpportunities.length > 0) {
        report += `## Optimization Opportunities\n`;
        optimizationOpportunities.forEach((opp, i) => {
            report += `### ${i + 1}. ${opp.description}\n`;
            report += `Impact: ${opp.impact} | Estimated Savings: ${opp.estimatedSavings}\n\n`;
        });
    }

    return report;
}