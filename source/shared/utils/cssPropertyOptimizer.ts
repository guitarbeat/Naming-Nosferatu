import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface CSSCustomProperty {
    name: string;
    value: string;
    file: string;
    line: number;
    selector: string;
}

interface PropertyOptimization {
    duplicates: CSSCustomProperty[];
    redundant: CSSCustomProperty[];
    optimized: CSSCustomProperty[];
}

export class CSSPropertyOptimizer {
    private customProperties = new Map<string, CSSCustomProperty[]>();
    private duplicateProperties: CSSCustomProperty[] = [];
    private redundantProperties: CSSCustomProperty[] = [];
    private optimizedProperties: CSSCustomProperty[] = [];

    // Extract CSS custom properties from files
    private extractCustomProperties(cssContent: string, filePath: string): CSSCustomProperty[] {
        const lines = cssContent.split('\n');
        const properties: CSSCustomProperty[] = [];
        let currentSelector = '';
        let inRule = false;
        let braceCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip comments and empty lines
            if (line.startsWith('/*') || line.startsWith('*') || line.startsWith('*/') || !line) {
                continue;
            }

            // Track current selector
            if (line.includes('{')) {
                braceCount += (line.match(/{/g) || []).length;
                if (!inRule) {
                    currentSelector = line.split('{')[0].trim();
                    inRule = true;
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

            // Extract custom properties
            const propertyMatch = line.match(/^\s*(--[\w-]+)\s*:\s*(.+?);?\s*$/);
            if (propertyMatch && inRule) {
                const [, name, value] = propertyMatch;
                properties.push({
                    name: name.trim(),
                    value: value.replace(/;$/, '').trim(),
                    file: filePath,
                    line: i + 1,
                    selector: currentSelector
                });
            }
        }

        return properties;
    }

    // Find duplicate property definitions
    private findDuplicates(): void {
        const propertyMap = new Map<string, CSSCustomProperty[]>();

        // Group properties by name
        for (const [, properties] of this.customProperties) {
            for (const prop of properties) {
                if (!propertyMap.has(prop.name)) {
                    propertyMap.set(prop.name, []);
                }
                propertyMap.get(prop.name)!.push(prop);
            }
        }

        // Find duplicates (same name, same value, different locations)
        for (const [name, props] of propertyMap) {
            if (props.length > 1) {
                const valueGroups = new Map<string, CSSCustomProperty[]>();

                for (const prop of props) {
                    if (!valueGroups.has(prop.value)) {
                        valueGroups.set(prop.value, []);
                    }
                    valueGroups.get(prop.value)!.push(prop);
                }

                // Mark duplicates (same value in multiple places)
                for (const [value, duplicates] of valueGroups) {
                    if (duplicates.length > 1) {
                        // Keep the first one (usually in design-tokens.css), mark others as duplicates
                        const sorted = duplicates.sort((a, b) => {
                            if (a.file.includes('design-tokens.css')) return -1;
                            if (b.file.includes('design-tokens.css')) return 1;
                            return a.file.localeCompare(b.file);
                        });

                        this.duplicateProperties.push(...sorted.slice(1));
                    }
                }
            }
        }
    }

    // Find redundant property declarations
    private findRedundant(): void {
        const propertyMap = new Map<string, CSSCustomProperty[]>();

        // Group properties by name
        for (const [, properties] of this.customProperties) {
            for (const prop of properties) {
                if (!propertyMap.has(prop.name)) {
                    propertyMap.set(prop.name, []);
                }
                propertyMap.get(prop.name)!.push(prop);
            }
        }

        // Find properties that override others in the same selector
        for (const [name, props] of propertyMap) {
            const bySelectorFile = new Map<string, CSSCustomProperty[]>();

            for (const prop of props) {
                const key = `${prop.file}:${prop.selector}`;
                if (!bySelectorFile.has(key)) {
                    bySelectorFile.set(key, []);
                }
                bySelectorFile.get(key)!.push(prop);
            }

            // If multiple declarations in same selector, mark earlier ones as redundant
            for (const [, selectorProps] of bySelectorFile) {
                if (selectorProps.length > 1) {
                    const sorted = selectorProps.sort((a, b) => a.line - b.line);
                    this.redundantProperties.push(...sorted.slice(0, -1));
                }
            }
        }
    }

    // Optimize property inheritance chains
    private optimizeInheritance(): void {
        const propertyMap = new Map<string, CSSCustomProperty[]>();

        // Group properties by name
        for (const [, properties] of this.customProperties) {
            for (const prop of properties) {
                if (!propertyMap.has(prop.name)) {
                    propertyMap.set(prop.name, []);
                }
                propertyMap.get(prop.name)!.push(prop);
            }
        }

        // Look for properties that can be consolidated
        for (const [name, props] of propertyMap) {
            // Find properties with var() references that could be simplified
            const varReferences = props.filter(p => p.value.includes('var('));

            for (const prop of varReferences) {
                // Check if the referenced variable has the same value as this property
                const varMatch = prop.value.match(/var\((--[\w-]+)\)/);
                if (varMatch) {
                    const referencedVar = varMatch[1];
                    const referencedProps = propertyMap.get(referencedVar);

                    if (referencedProps && referencedProps.length === 1) {
                        const referencedProp = referencedProps[0];

                        // If the referenced property is only used once and has a simple value,
                        // we can potentially inline it
                        if (!referencedProp.value.includes('var(') &&
                            !this.isPropertyUsedElsewhere(referencedVar, propertyMap)) {
                            this.optimizedProperties.push({
                                ...prop,
                                value: prop.value.replace(`var(${referencedVar})`, referencedProp.value)
                            });
                        }
                    }
                }
            }
        }
    }

    // Check if a property is used elsewhere
    private isPropertyUsedElsewhere(propertyName: string, propertyMap: Map<string, CSSCustomProperty[]>): boolean {
        let usageCount = 0;

        for (const [, props] of propertyMap) {
            for (const prop of props) {
                if (prop.value.includes(`var(${propertyName})`)) {
                    usageCount++;
                }
            }
        }

        return usageCount > 1;
    }

    async analyzeCSSProperties(): Promise<PropertyOptimization> {
        console.log('🔍 Analyzing CSS custom properties...\n');

        // Get all CSS files
        const cssFiles = await glob('source/shared/styles/*.css');

        // Extract all custom properties
        for (const file of cssFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const properties = this.extractCustomProperties(content, file);
            this.customProperties.set(file, properties);
        }

        const totalProperties = Array.from(this.customProperties.values())
            .reduce((sum, props) => sum + props.length, 0);

        console.log(`📊 Found ${totalProperties} custom properties across ${cssFiles.length} files`);

        // Analyze for optimizations
        this.findDuplicates();
        this.findRedundant();
        this.optimizeInheritance();

        console.log(`🔍 Found ${this.duplicateProperties.length} duplicate properties`);
        console.log(`🔍 Found ${this.redundantProperties.length} redundant properties`);
        console.log(`🔍 Found ${this.optimizedProperties.length} optimization opportunities\n`);

        return {
            duplicates: this.duplicateProperties,
            redundant: this.redundantProperties,
            optimized: this.optimizedProperties
        };
    }

    generateReport(): void {
        console.log('📋 CSS CUSTOM PROPERTY OPTIMIZATION REPORT');
        console.log('==========================================\n');

        if (this.duplicateProperties.length > 0) {
            console.log('🔄 DUPLICATE PROPERTIES:');
            const byFile = new Map<string, CSSCustomProperty[]>();

            this.duplicateProperties.forEach(prop => {
                if (!byFile.has(prop.file)) byFile.set(prop.file, []);
                byFile.get(prop.file)!.push(prop);
            });

            byFile.forEach((props, file) => {
                console.log(`📄 ${file}:`);
                props.forEach(prop => {
                    console.log(`   Line ${prop.line}: ${prop.name}: ${prop.value} (in ${prop.selector})`);
                });
                console.log('');
            });
        }

        if (this.redundantProperties.length > 0) {
            console.log('♻️  REDUNDANT PROPERTIES:');
            const byFile = new Map<string, CSSCustomProperty[]>();

            this.redundantProperties.forEach(prop => {
                if (!byFile.has(prop.file)) byFile.set(prop.file, []);
                byFile.get(prop.file)!.push(prop);
            });

            byFile.forEach((props, file) => {
                console.log(`📄 ${file}:`);
                props.forEach(prop => {
                    console.log(`   Line ${prop.line}: ${prop.name}: ${prop.value} (overridden in ${prop.selector})`);
                });
                console.log('');
            });
        }

        if (this.optimizedProperties.length > 0) {
            console.log('⚡ OPTIMIZATION OPPORTUNITIES:');
            this.optimizedProperties.forEach(prop => {
                console.log(`📄 ${prop.file} (Line ${prop.line}): ${prop.name} can be optimized`);
            });
            console.log('');
        }

        const totalOptimizations = this.duplicateProperties.length +
            this.redundantProperties.length +
            this.optimizedProperties.length;

        console.log(`🎯 Total optimization opportunities: ${totalOptimizations}`);
    }

    async optimizeProperties(): Promise<void> {
        console.log('\n🛠️  Optimizing CSS custom properties...\n');

        const fileChanges = new Map<string, string>();

        // Load all files that need changes
        const filesToModify = new Set([
            ...this.duplicateProperties.map(p => p.file),
            ...this.redundantProperties.map(p => p.file),
            ...this.optimizedProperties.map(p => p.file)
        ]);

        for (const filePath of filesToModify) {
            fileChanges.set(filePath, fs.readFileSync(filePath, 'utf8'));
        }

        // Remove duplicate properties
        for (const prop of this.duplicateProperties) {
            const content = fileChanges.get(prop.file)!;
            const lines = content.split('\n');

            // Find and remove the duplicate property line
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(prop.name) && lines[i].includes(prop.value)) {
                    // Check if this is the exact line
                    if (Math.abs(i + 1 - prop.line) <= 2) { // Allow some tolerance
                        lines[i] = ''; // Remove the line
                        break;
                    }
                }
            }

            fileChanges.set(prop.file, lines.join('\n'));
        }

        // Remove redundant properties
        for (const prop of this.redundantProperties) {
            const content = fileChanges.get(prop.file)!;
            const lines = content.split('\n');

            // Find and remove the redundant property line
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(prop.name) && lines[i].includes(prop.value)) {
                    // Check if this is the exact line
                    if (Math.abs(i + 1 - prop.line) <= 2) { // Allow some tolerance
                        lines[i] = ''; // Remove the line
                        break;
                    }
                }
            }

            fileChanges.set(prop.file, lines.join('\n'));
        }

        // Apply optimizations
        for (const prop of this.optimizedProperties) {
            const content = fileChanges.get(prop.file)!;
            const lines = content.split('\n');

            // Find and update the property line
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(prop.name)) {
                    // Check if this is the exact line
                    if (Math.abs(i + 1 - prop.line) <= 2) { // Allow some tolerance
                        lines[i] = lines[i].replace(/:\s*.+?;/, `: ${prop.value};`);
                        break;
                    }
                }
            }

            fileChanges.set(prop.file, lines.join('\n'));
        }

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
            console.log(`✅ ${filePath}: Optimized custom properties`);
        }

        const totalOptimizations = this.duplicateProperties.length +
            this.redundantProperties.length +
            this.optimizedProperties.length;

        console.log(`\n🎉 Successfully optimized ${totalOptimizations} custom properties across ${modifiedFiles} files`);
    }

    generateOptimizationReport(): void {
        const reportPath = 'css-property-optimization-report.md';
        let report = '# CSS Custom Property Optimization Report\n\n';
        report += `Generated on: ${new Date().toISOString()}\n\n`;

        const totalOptimizations = this.duplicateProperties.length +
            this.redundantProperties.length +
            this.optimizedProperties.length;

        report += `## Summary\n\n`;
        report += `- Total optimizations applied: ${totalOptimizations}\n`;
        report += `- Duplicate properties removed: ${this.duplicateProperties.length}\n`;
        report += `- Redundant properties removed: ${this.redundantProperties.length}\n`;
        report += `- Properties optimized: ${this.optimizedProperties.length}\n`;
        report += `- Files modified: ${new Set([
            ...this.duplicateProperties.map(p => p.file),
            ...this.redundantProperties.map(p => p.file),
            ...this.optimizedProperties.map(p => p.file)
        ]).size}\n\n`;

        if (this.duplicateProperties.length > 0) {
            report += `## Removed Duplicate Properties\n\n`;
            const byFile = new Map<string, CSSCustomProperty[]>();

            this.duplicateProperties.forEach(prop => {
                if (!byFile.has(prop.file)) byFile.set(prop.file, []);
                byFile.get(prop.file)!.push(prop);
            });

            byFile.forEach((props, file) => {
                report += `### ${file}\n\n`;
                props.forEach(prop => {
                    report += `**Line ${prop.line}:** \`${prop.name}: ${prop.value}\` (in \`${prop.selector}\`)\n\n`;
                });
            });
        }

        if (this.redundantProperties.length > 0) {
            report += `## Removed Redundant Properties\n\n`;
            const byFile = new Map<string, CSSCustomProperty[]>();

            this.redundantProperties.forEach(prop => {
                if (!byFile.has(prop.file)) byFile.set(prop.file, []);
                byFile.get(prop.file)!.push(prop);
            });

            byFile.forEach((props, file) => {
                report += `### ${file}\n\n`;
                props.forEach(prop => {
                    report += `**Line ${prop.line}:** \`${prop.name}: ${prop.value}\` (overridden in \`${prop.selector}\`)\n\n`;
                });
            });
        }

        if (this.optimizedProperties.length > 0) {
            report += `## Optimized Properties\n\n`;
            this.optimizedProperties.forEach(prop => {
                report += `**${prop.file} (Line ${prop.line}):** \`${prop.name}\` optimized to \`${prop.value}\`\n\n`;
            });
        }

        fs.writeFileSync(reportPath, report);
        console.log(`📄 Detailed report saved to: ${reportPath}`);
    }
}