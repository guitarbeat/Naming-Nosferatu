import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface MediaQuery {
    query: string;
    content: string;
    file: string;
    startLine: number;
    endLine: number;
}

interface BreakpointUsage {
    breakpoint: string;
    count: number;
    files: string[];
    queries: MediaQuery[];
}

interface MediaQueryOptimization {
    duplicateQueries: MediaQuery[];
    consolidatedQueries: Map<string, MediaQuery[]>;
    breakpointUsage: BreakpointUsage[];
}

export class MediaQueryOptimizer {
    private mediaQueries: MediaQuery[] = [];
    private duplicateQueries: MediaQuery[] = [];
    private consolidatedQueries = new Map<string, MediaQuery[]>();
    private breakpointUsage: BreakpointUsage[] = [];

    // Standard breakpoints for consistency
    private standardBreakpoints = {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px'
    };

    // Extract media queries from CSS files
    private extractMediaQueries(cssContent: string, filePath: string): MediaQuery[] {
        const lines = cssContent.split('\n');
        const queries: MediaQuery[] = [];
        let currentQuery: MediaQuery | null = null;
        let braceCount = 0;
        let inMediaQuery = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip comments and empty lines
            if (line.startsWith('/*') || line.startsWith('*') || line.startsWith('*/') || !line) {
                continue;
            }

            // Detect media query start
            if (line.startsWith('@media')) {
                const queryMatch = line.match(/@media\s+(.+?)\s*\{?/);
                if (queryMatch) {
                    currentQuery = {
                        query: queryMatch[1].trim(),
                        content: '',
                        file: filePath,
                        startLine: i + 1,
                        endLine: i + 1
                    };
                    inMediaQuery = true;
                    braceCount = (line.match(/{/g) || []).length;
                }
            }

            if (inMediaQuery && currentQuery) {
                // Add content to current query
                currentQuery.content += line + '\n';

                // Track braces
                if (line.includes('{')) {
                    braceCount += (line.match(/{/g) || []).length;
                }
                if (line.includes('}')) {
                    braceCount -= (line.match(/}/g) || []).length;

                    // End of media query
                    if (braceCount <= 0) {
                        currentQuery.endLine = i + 1;
                        queries.push(currentQuery);
                        currentQuery = null;
                        inMediaQuery = false;
                        braceCount = 0;
                    }
                }
            }
        }

        return queries;
    }

    // Normalize media query for comparison
    private normalizeMediaQuery(query: string): string {
        return query
            .replace(/\s+/g, ' ')
            .replace(/\(\s*/g, '(')
            .replace(/\s*\)/g, ')')
            .replace(/:\s*/g, ':')
            .toLowerCase()
            .trim();
    }

    // Extract breakpoint value from media query
    private extractBreakpoint(query: string): string | null {
        const minWidthMatch = query.match(/min-width:\s*(\d+(?:\.\d+)?)(px|em|rem)/);
        const maxWidthMatch = query.match(/max-width:\s*(\d+(?:\.\d+)?)(px|em|rem)/);

        if (minWidthMatch) {
            return `min-${minWidthMatch[1]}${minWidthMatch[2]}`;
        }
        if (maxWidthMatch) {
            return `max-${maxWidthMatch[1]}${maxWidthMatch[2]}`;
        }

        return null;
    }

    // Find duplicate media queries
    private findDuplicates(): void {
        const queryMap = new Map<string, MediaQuery[]>();

        // Group queries by normalized query string
        for (const query of this.mediaQueries) {
            const normalized = this.normalizeMediaQuery(query.query);
            if (!queryMap.has(normalized)) {
                queryMap.set(normalized, []);
            }
            queryMap.get(normalized)!.push(query);
        }

        // Find duplicates
        for (const [normalizedQuery, queries] of queryMap) {
            if (queries.length > 1) {
                // Mark all but the first as duplicates
                this.duplicateQueries.push(...queries.slice(1));
                this.consolidatedQueries.set(normalizedQuery, queries);
            }
        }
    }

    // Analyze breakpoint usage
    private analyzeBreakpointUsage(): void {
        const breakpointMap = new Map<string, MediaQuery[]>();

        for (const query of this.mediaQueries) {
            const breakpoint = this.extractBreakpoint(query.query);
            if (breakpoint) {
                if (!breakpointMap.has(breakpoint)) {
                    breakpointMap.set(breakpoint, []);
                }
                breakpointMap.get(breakpoint)!.push(query);
            }
        }

        // Create breakpoint usage summary
        for (const [breakpoint, queries] of breakpointMap) {
            const files = [...new Set(queries.map(q => q.file))];
            this.breakpointUsage.push({
                breakpoint,
                count: queries.length,
                files,
                queries
            });
        }

        // Sort by usage count
        this.breakpointUsage.sort((a, b) => b.count - a.count);
    }

    async analyzeMediaQueries(): Promise<MediaQueryOptimization> {
        console.log('🔍 Analyzing media queries and responsive patterns...\n');

        // Get all CSS files
        const cssFiles = await glob('source/shared/styles/*.css');

        // Extract all media queries
        for (const file of cssFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const queries = this.extractMediaQueries(content, file);
            this.mediaQueries.push(...queries);
        }

        console.log(`📊 Found ${this.mediaQueries.length} media queries across ${cssFiles.length} files`);

        // Analyze for optimizations
        this.findDuplicates();
        this.analyzeBreakpointUsage();

        console.log(`🔍 Found ${this.duplicateQueries.length} duplicate media queries`);
        console.log(`🔍 Found ${this.consolidatedQueries.size} consolidation opportunities`);
        console.log(`🔍 Analyzed ${this.breakpointUsage.length} different breakpoints\n`);

        return {
            duplicateQueries: this.duplicateQueries,
            consolidatedQueries: this.consolidatedQueries,
            breakpointUsage: this.breakpointUsage
        };
    }

    generateReport(): void {
        console.log('📋 MEDIA QUERY OPTIMIZATION REPORT');
        console.log('==================================\n');

        if (this.duplicateQueries.length > 0) {
            console.log('🔄 DUPLICATE MEDIA QUERIES:');
            const byFile = new Map<string, MediaQuery[]>();

            this.duplicateQueries.forEach(query => {
                if (!byFile.has(query.file)) byFile.set(query.file, []);
                byFile.get(query.file)!.push(query);
            });

            byFile.forEach((queries, file) => {
                console.log(`📄 ${file}:`);
                queries.forEach(query => {
                    console.log(`   Lines ${query.startLine}-${query.endLine}: @media ${query.query}`);
                });
                console.log('');
            });
        }

        if (this.consolidatedQueries.size > 0) {
            console.log('📦 CONSOLIDATION OPPORTUNITIES:');
            this.consolidatedQueries.forEach((queries, normalizedQuery) => {
                console.log(`🎯 Query: ${normalizedQuery}`);
                console.log(`   Found in ${queries.length} locations:`);
                queries.forEach(query => {
                    console.log(`   - ${query.file} (Lines ${query.startLine}-${query.endLine})`);
                });
                console.log('');
            });
        }

        if (this.breakpointUsage.length > 0) {
            console.log('📊 BREAKPOINT USAGE ANALYSIS:');
            this.breakpointUsage.forEach(usage => {
                console.log(`📐 ${usage.breakpoint}: Used ${usage.count} times across ${usage.files.length} files`);
                usage.files.forEach(file => {
                    const fileQueries = usage.queries.filter(q => q.file === file);
                    console.log(`   - ${file} (${fileQueries.length} occurrences)`);
                });
                console.log('');
            });
        }

        console.log(`🎯 Total optimization opportunities: ${this.duplicateQueries.length + this.consolidatedQueries.size}`);
    }

    async optimizeMediaQueries(): Promise<void> {
        console.log('\n🛠️  Optimizing media queries...\n');

        const fileChanges = new Map<string, string>();

        // Load all files that need changes
        const filesToModify = new Set(this.duplicateQueries.map(q => q.file));

        for (const filePath of filesToModify) {
            fileChanges.set(filePath, fs.readFileSync(filePath, 'utf8'));
        }

        // Remove duplicate media queries (keep the first occurrence)
        const processedQueries = new Set<string>();

        for (const query of this.duplicateQueries) {
            const queryKey = `${query.file}:${query.startLine}:${query.endLine}`;

            if (!processedQueries.has(queryKey)) {
                const content = fileChanges.get(query.file)!;
                const lines = content.split('\n');

                // Remove the duplicate media query block
                const startIndex = query.startLine - 1;
                const endIndex = query.endLine - 1;

                // Replace the lines with empty strings
                for (let i = startIndex; i <= endIndex; i++) {
                    if (i < lines.length) {
                        lines[i] = '';
                    }
                }

                fileChanges.set(query.file, lines.join('\n'));
                processedQueries.add(queryKey);
            }
        }

        // Create consolidated media query files for major breakpoints
        await this.createConsolidatedResponsiveFile();

        // Clean up empty lines and write files back
        let modifiedFiles = 0;
        for (const [filePath, content] of fileChanges) {
            // Clean up multiple consecutive empty lines
            const cleanedContent = content
                .split('\n')
                .reduce((acc, line, index, array) => {
                    // Keep the line if it's not empty, or if it's empty but not following another empty line
                    if (line.trim() !== '' || (index > 0 && array[index - 1].trim() !== '')) {
                        acc.push(line);
                    }
                    return acc;
                }, [] as string[])
                .join('\n');

            fs.writeFileSync(filePath, cleanedContent);
            modifiedFiles++;
            console.log(`✅ ${filePath}: Optimized media queries`);
        }

        console.log(`\n🎉 Successfully optimized ${this.duplicateQueries.length} duplicate media queries across ${modifiedFiles} files`);
    }

    // Create a consolidated responsive utilities file
    private async createConsolidatedResponsiveFile(): Promise<void> {
        const responsiveContent = `/* Consolidated Responsive Utilities */
/* Generated by Media Query Optimizer */

/* Standard Breakpoints */
:root {
  --breakpoint-sm: ${this.standardBreakpoints.sm};
  --breakpoint-md: ${this.standardBreakpoints.md};
  --breakpoint-lg: ${this.standardBreakpoints.lg};
  --breakpoint-xl: ${this.standardBreakpoints.xl};
  --breakpoint-2xl: ${this.standardBreakpoints['2xl']};
}

/* Mobile First Responsive Utilities */
@media (min-width: ${this.standardBreakpoints.sm}) {
  .sm\\:block { display: block; }
  .sm\\:flex { display: flex; }
  .sm\\:grid { display: grid; }
  .sm\\:hidden { display: none; }
  
  .sm\\:text-sm { font-size: var(--text-sm); }
  .sm\\:text-base { font-size: var(--text-base); }
  .sm\\:text-lg { font-size: var(--text-lg); }
  
  .sm\\:p-4 { padding: var(--space-4); }
  .sm\\:p-6 { padding: var(--space-6); }
  .sm\\:p-8 { padding: var(--space-8); }
}

@media (min-width: ${this.standardBreakpoints.md}) {
  .md\\:block { display: block; }
  .md\\:flex { display: flex; }
  .md\\:grid { display: grid; }
  .md\\:hidden { display: none; }
  
  .md\\:text-base { font-size: var(--text-base); }
  .md\\:text-lg { font-size: var(--text-lg); }
  .md\\:text-xl { font-size: var(--text-xl); }
  
  .md\\:p-6 { padding: var(--space-6); }
  .md\\:p-8 { padding: var(--space-8); }
  .md\\:p-12 { padding: var(--space-12); }
}

@media (min-width: ${this.standardBreakpoints.lg}) {
  .lg\\:block { display: block; }
  .lg\\:flex { display: flex; }
  .lg\\:grid { display: grid; }
  .lg\\:hidden { display: none; }
  
  .lg\\:text-lg { font-size: var(--text-lg); }
  .lg\\:text-xl { font-size: var(--text-xl); }
  .lg\\:text-2xl { font-size: var(--text-2xl); }
  
  .lg\\:p-8 { padding: var(--space-8); }
  .lg\\:p-12 { padding: var(--space-12); }
  .lg\\:p-16 { padding: var(--space-16); }
}

@media (min-width: ${this.standardBreakpoints.xl}) {
  .xl\\:block { display: block; }
  .xl\\:flex { display: flex; }
  .xl\\:grid { display: grid; }
  .xl\\:hidden { display: none; }
  
  .xl\\:text-xl { font-size: var(--text-xl); }
  .xl\\:text-2xl { font-size: var(--text-2xl); }
  .xl\\:text-3xl { font-size: var(--text-3xl); }
  
  .xl\\:p-12 { padding: var(--space-12); }
  .xl\\:p-16 { padding: var(--space-16); }
  .xl\\:p-20 { padding: var(--space-20); }
}

/* Common Responsive Patterns */
@media (max-width: calc(${this.standardBreakpoints.md} - 1px)) {
  .mobile-only { display: block; }
  .desktop-only { display: none; }
  
  .mobile-stack > * + * {
    margin-top: var(--space-4);
  }
  
  .mobile-full-width {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
  }
}

@media (min-width: ${this.standardBreakpoints.md}) {
  .mobile-only { display: none; }
  .desktop-only { display: block; }
  
  .desktop-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-6);
  }
}

/* Print Styles */
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  
  * {
    color: black !important;
    background: white !important;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High Contrast */
@media (prefers-contrast: high) {
  :root {
    --color-border: #000000;
    --color-text: #000000;
    --color-background: #ffffff;
  }
}
`;

        const responsiveFilePath = 'source/shared/styles/responsive-utilities.css';
        fs.writeFileSync(responsiveFilePath, responsiveContent);
        console.log(`✅ Created consolidated responsive utilities: ${responsiveFilePath}`);
    }

    generateOptimizationReport(): void {
        const reportPath = 'media-query-optimization-report.md';
        let report = '# Media Query Optimization Report\n\n';
        report += `Generated on: ${new Date().toISOString()}\n\n`;

        const totalOptimizations = this.duplicateQueries.length + this.consolidatedQueries.size;

        report += `## Summary\n\n`;
        report += `- Total media queries analyzed: ${this.mediaQueries.length}\n`;
        report += `- Duplicate queries removed: ${this.duplicateQueries.length}\n`;
        report += `- Consolidation opportunities: ${this.consolidatedQueries.size}\n`;
        report += `- Different breakpoints found: ${this.breakpointUsage.length}\n`;
        report += `- Files with media queries: ${new Set(this.mediaQueries.map(q => q.file)).size}\n\n`;

        if (this.duplicateQueries.length > 0) {
            report += `## Removed Duplicate Media Queries\n\n`;
            const byFile = new Map<string, MediaQuery[]>();

            this.duplicateQueries.forEach(query => {
                if (!byFile.has(query.file)) byFile.set(query.file, []);
                byFile.get(query.file)!.push(query);
            });

            byFile.forEach((queries, file) => {
                report += `### ${file}\n\n`;
                queries.forEach(query => {
                    report += `**Lines ${query.startLine}-${query.endLine}:** \`@media ${query.query}\`\n\n`;
                });
            });
        }

        if (this.breakpointUsage.length > 0) {
            report += `## Breakpoint Usage Analysis\n\n`;
            this.breakpointUsage.forEach(usage => {
                report += `### ${usage.breakpoint}\n\n`;
                report += `- **Usage Count:** ${usage.count}\n`;
                report += `- **Files:** ${usage.files.length}\n\n`;
                usage.files.forEach(file => {
                    const fileQueries = usage.queries.filter(q => q.file === file);
                    report += `- \`${file}\` (${fileQueries.length} occurrences)\n`;
                });
                report += '\n';
            });
        }

        report += `## Recommendations\n\n`;
        report += `1. **Standardize Breakpoints:** Use consistent breakpoint values across all files\n`;
        report += `2. **Mobile-First Approach:** Prefer min-width media queries for better performance\n`;
        report += `3. **Consolidate Similar Queries:** Group related styles within the same media query\n`;
        report += `4. **Use Responsive Utilities:** Leverage the new responsive utilities file for common patterns\n\n`;

        fs.writeFileSync(reportPath, report);
        console.log(`📄 Detailed report saved to: ${reportPath}`);
    }
}