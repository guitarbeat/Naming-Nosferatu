import { UnusedCSSAnalyzer } from '../source/shared/utils/unusedCSSAnalyzer.js';

async function main() {
    const analyzer = new UnusedCSSAnalyzer();

    try {
        console.log('Starting CSS unused selector analysis...\n');

        const unusedSelectors = await analyzer.analyzeCSSFiles();
        analyzer.generateReport();

        if (unusedSelectors.length > 0) {
            console.log('\n🧹 Removing unused selectors automatically...');
            await analyzer.removeUnusedSelectors();
            const report = analyzer.generateRemovalReport();

            console.log('\n✅ CSS cleanup completed successfully!');
            console.log(`📊 Summary: ${report.removedSelectors.length} selectors removed from ${report.filesModified} files`);
        } else {
            console.log('\n✅ No unused selectors found - CSS is already optimized!');
        }

    } catch (error) {
        console.error('❌ Error during CSS analysis:', error);
        process.exit(1);
    }
}

main();