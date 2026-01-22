import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface CSSSelector {
    selector: string;
    file: string;
    line: number;
    used: boolean;
}

interface UnusedSelectorReport {
    unusedSelectors: CSSSelector[];
    removedSelectors: CSSSelector[];
    totalAnalyzed: number;
    filesModified: number;
}

export class UnusedCSSAnalyzer {
    private cssSelectors = new Map<string, CSSSelector>();
    private usedClasses = new Set<string>();
    private usedIds = new Set<string>();
    private usedElements = new Set<string>();
    private unusedSelectors: CSSSelector[] = [];
    private removedSelectors: CSSSelector[] = [];

    // Extract CSS selectors from files
    private extractCSSSelectors(cssContent: string, filePath: string): CSSSelector[] {
        const lines = cssContent.split('\n');
        const selectors: CSSSelector[] = [];

        let currentSelector = '';
        let inRule = false;
        let braceCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip comments, empty lines, and CSS variables
            if (line.startsWith('/*') || line.startsWith('*') || line.startsWith('*/') ||
                !line || line.startsWith(':root') || line.startsWith('@') || line.startsWith('--')) {
                continue;
            }

            if (line.includes('{')) {
                braceCount += (line.match(/{/g) || []).length;
                if (!inRule) {
                    currentSelector = line.split('{')[0].trim();
                    inRule = true;

                    // Clean up selector
                    currentSelector = currentSelector
                        .replace(/\/\*.*?\*\//g, '') // Remove comments
                        .replace(/\s+/g, ' ') // Normalize whitespace
                        .trim();

                    if (currentSelector && !currentSelector.startsWith(':root') && !currentSelector.startsWith('@')) {
                        selectors.push({
                            selector: currentSelector,
                            file: filePath,
                            line: i + 1,
                            used: false
                        });
                    }
                }
            }

            if (line.includes('}')) {
                braceCount -= (line.match(/}/g) || []).length;
                if (braceCount <= 0) {
                    inRule = false;
                    currentSelector = '';
                    braceCount = 0;
                }
            }
        }

        return selectors;
    }

    // Extract used classes, IDs, and elements from source files
    private extractUsedSelectors(content: string): void {
        // Extract className usage
        const classMatches = content.match(/className\s*=\s*["'`]([^"'`]+)["'`]/g) || [];
        classMatches.forEach(match => {
            const classes = match.match(/["'`]([^"'`]+)["'`]/)?.[1];
            if (classes) {
                classes.split(/\s+/).forEach(cls => {
                    if (cls) this.usedClasses.add(cls);
                });
            }
        });

        // Extract CSS module usage
        const moduleMatches = content.match(/styles\.(\w+)/g) || [];
        moduleMatches.forEach(match => {
            const className = match.replace('styles.', '');
            this.usedClasses.add(className);
        });

        // Extract template literal classes
        const templateMatches = content.match(/`[^`]*\$\{[^}]*\}[^`]*`/g) || [];
        templateMatches.forEach(match => {
            const classes = match.match(/[\w-]+/g) || [];
            classes.forEach(cls => {
                if (cls && cls.length > 2) this.usedClasses.add(cls);
            });
        });

        // Extract HTML elements
        const elementMatches = content.match(/<(\w+)/g) || [];
        elementMatches.forEach(match => {
            const element = match.replace('<', '');
            this.usedElements.add(element);
        });

        // Extract id usage
        const idMatches = content.match(/id\s*=\s*["'`]([^"'`]+)["'`]/g) || [];
        idMatches.forEach(match => {
            const id = match.match(/["'`]([^"'`]+)["'`]/)?.[1];
            if (id) this.usedIds.add(id);
        });
    }

    // Check if a CSS selector is used
    private isSelectorUsed(selector: string): boolean {
        // Clean selector for analysis
        const cleanSelector = selector
            .replace(/::?[\w-]+/g, '') // Remove pseudo-elements and pseudo-classes
            .replace(/\[.*?\]/g, '') // Remove attribute selectors
            .replace(/\s*[>+~]\s*/g, ' ') // Replace combinators with spaces
            .trim();

        // Split compound selectors
        const parts = cleanSelector.split(/\s+/);

        for (const part of parts) {
            if (!part) continue;

            // Check class selectors
            if (part.startsWith('.')) {
                const className = part.substring(1).replace(/[^\w-]/g, '');
                if (className && this.usedClasses.has(className)) {
                    return true;
                }
            }

            // Check ID selectors
            else if (part.startsWith('#')) {
                const id = part.substring(1).replace(/[^\w-]/g, '');
                if (id && this.usedIds.has(id)) {
                    return true;
                }
            }

            // Check element selectors
            else if (/^[a-zA-Z][\w-]*$/.test(part)) {
                if (this.usedElements.has(part)) {
                    return true;
                }
            }
        }

        return false;
    }

    async analyzeCSSFiles(): Promise<CSSSelector[]> {
        console.log('🔍 Analyzing CSS files for unused selectors...\n');

        // Get all CSS files
        const cssFiles = await glob('source/shared/styles/*.css');

        // Extract all CSS selectors
        for (const file of cssFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const selectors = this.extractCSSSelectors(content, file);

            selectors.forEach(sel => {
                this.cssSelectors.set(`${sel.file}:${sel.line}:${sel.selector}`, sel);
            });
        }

        console.log(`📊 Found ${this.cssSelectors.size} CSS selectors across ${cssFiles.length} files`);

        // Get all source files
        const sourceFiles = await glob('source/**/*.{tsx,ts,jsx,js}');

        // Extract used selectors from source files
        for (const file of sourceFiles) {
            const content = fs.readFileSync(file, 'utf8');
            this.extractUsedSelectors(content);
        }

        console.log(`📊 Found ${this.usedClasses.size} used classes, ${this.usedIds.size} used IDs, ${this.usedElements.size} used elements\n`);

        // Check which selectors are unused
        for (const [key, selector] of this.cssSelectors) {
            if (!this.isSelectorUsed(selector.selector)) {
                this.unusedSelectors.push(selector);
            }
        }

        return this.unusedSelectors;
    }

    generateReport(): void {
        console.log('📋 UNUSED CSS SELECTORS REPORT');
        console.log('================================\n');

        if (this.unusedSelectors.length === 0) {
            console.log('✅ No unused selectors found!');
            return;
        }

        // Group by file
        const byFile: Record<string, CSSSelector[]> = {};
        this.unusedSelectors.forEach(sel => {
            if (!byFile[sel.file]) byFile[sel.file] = [];
            byFile[sel.file].push(sel);
        });

        Object.entries(byFile).forEach(([file, selectors]) => {
            console.log(`📄 ${file} (${selectors.length} unused selectors):`);
            selectors.forEach(sel => {
                console.log(`   Line ${sel.line}: ${sel.selector}`);
            });
            console.log('');
        });

        console.log(`🗑️  Total unused selectors: ${this.unusedSelectors.length}`);
    }

    async removeUnusedSelectors(): Promise<void> {
        console.log('\n🧹 Removing unused selectors...\n');

        const fileChanges: Record<string, CSSSelector[]> = {};

        // Group removals by file
        this.unusedSelectors.forEach(sel => {
            if (!fileChanges[sel.file]) {
                fileChanges[sel.file] = [];
            }
            fileChanges[sel.file].push(sel);
        });

        // Process each file
        for (const [filePath, selectorsToRemove] of Object.entries(fileChanges)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');

            // Sort by line number (descending) to avoid index issues
            selectorsToRemove.sort((a, b) => b.line - a.line);

            let removedCount = 0;

            for (const sel of selectorsToRemove) {
                const lineIndex = sel.line - 1;

                // Find the complete CSS rule (from selector to closing brace)
                let startLine = lineIndex;
                let endLine = lineIndex;
                let braceCount = 0;
                let foundOpenBrace = false;

                // Find start of rule (go backwards if needed)
                while (startLine >= 0) {
                    const line = lines[startLine].trim();
                    if (line.includes(sel.selector.split(',')[0].trim())) {
                        break;
                    }
                    startLine--;
                }

                // Find end of rule
                for (let i = startLine; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.includes('{')) {
                        foundOpenBrace = true;
                        braceCount += (line.match(/{/g) || []).length;
                    }
                    if (line.includes('}')) {
                        braceCount -= (line.match(/}/g) || []).length;
                        if (foundOpenBrace && braceCount <= 0) {
                            endLine = i;
                            break;
                        }
                    }
                }

                // Remove the lines
                if (startLine >= 0 && endLine < lines.length) {
                    const removedLines = lines.splice(startLine, endLine - startLine + 1);
                    removedCount++;

                    this.removedSelectors.push({
                        ...sel,
                        used: false
                    });
                }
            }

            // Write the modified content back
            if (removedCount > 0) {
                fs.writeFileSync(filePath, lines.join('\n'));
                console.log(`✅ ${filePath}: Removed ${removedCount} unused selectors`);
            }
        }

        console.log(`\n🎉 Successfully removed ${this.removedSelectors.length} unused selectors`);
    }

    generateRemovalReport(): UnusedSelectorReport {
        const reportPath = 'css-cleanup-report.md';
        let report = '# CSS Cleanup Report\n\n';
        report += `Generated on: ${new Date().toISOString()}\n\n`;
        report += `## Summary\n\n`;
        report += `- Total unused selectors removed: ${this.removedSelectors.length}\n`;
        report += `- Files modified: ${new Set(this.removedSelectors.map(s => s.file)).size}\n\n`;

        report += `## Removed Selectors\n\n`;

        const byFile: Record<string, CSSSelector[]> = {};
        this.removedSelectors.forEach(sel => {
            if (!byFile[sel.file]) byFile[sel.file] = [];
            byFile[sel.file].push(sel);
        });

        Object.entries(byFile).forEach(([file, selectors]) => {
            report += `### ${file}\n\n`;
            selectors.forEach(sel => {
                report += `**Line ${sel.line}:** \`${sel.selector}\`\n\n`;
            });
        });

        fs.writeFileSync(reportPath, report);
        console.log(`📄 Detailed report saved to: ${reportPath}`);

        return {
            unusedSelectors: this.unusedSelectors,
            removedSelectors: this.removedSelectors,
            totalAnalyzed: this.cssSelectors.size,
            filesModified: new Set(this.removedSelectors.map(s => s.file)).size
        };
    }
}