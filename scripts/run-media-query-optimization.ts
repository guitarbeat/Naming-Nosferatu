import { MediaQueryOptimizer } from '../source/shared/utils/mediaQueryOptimizer.js';

async function main() {
    const optimizer = new MediaQueryOptimizer();

    try {
        console.log('Starting media query optimization...\n');

        const analysis = await optimizer.analyzeMediaQueries();
        optimizer.generateReport();

        const totalOptimizations = analysis.duplicateQueries.length + analysis.consolidatedQueries.size;

        if (totalOptimizations > 0) {
            console.log('\n🛠️  Applying optimizations automatically...');
            await optimizer.optimizeMediaQueries();
            optimizer.generateOptimizationReport();

            console.log('\n✅ Media query optimization completed successfully!');
            console.log(`📊 Summary: ${totalOptimizations} optimizations applied`);
        } else {
            console.log('\n✅ No optimization opportunities found - Media queries are already optimized!');
        }

    } catch (error) {
        console.error('❌ Error during media query optimization:', error);
        process.exit(1);
    }
}

main();