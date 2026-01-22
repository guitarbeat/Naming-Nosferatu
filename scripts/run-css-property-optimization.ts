import { CSSPropertyOptimizer } from '../source/shared/utils/cssPropertyOptimizer.js';

async function main() {
    const optimizer = new CSSPropertyOptimizer();

    try {
        console.log('Starting CSS custom property optimization...\n');

        const analysis = await optimizer.analyzeCSSProperties();
        optimizer.generateReport();

        const totalOptimizations = analysis.duplicates.length +
            analysis.redundant.length +
            analysis.optimized.length;

        if (totalOptimizations > 0) {
            console.log('\n🛠️  Applying optimizations automatically...');
            await optimizer.optimizeProperties();
            optimizer.generateOptimizationReport();

            console.log('\n✅ CSS property optimization completed successfully!');
            console.log(`📊 Summary: ${totalOptimizations} properties optimized`);
        } else {
            console.log('\n✅ No optimization opportunities found - CSS properties are already optimized!');
        }

    } catch (error) {
        console.error('❌ Error during CSS property optimization:', error);
        process.exit(1);
    }
}

main();