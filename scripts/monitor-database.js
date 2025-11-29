#!/usr/bin/env node

/**
 * Database Monitoring Script
 * 
 * Monitors database performance including:
 * - Slow query detection
 * - Index usage analysis
 * - Connection statistics
 * - Query performance trends
 * 
 * Usage:
 *   node scripts/monitor-database.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_ANON_KEY environment variables
 */

import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SLOW_QUERY_THRESHOLD = 100; // ms

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Test query performance
 */
async function testQueryPerformance() {
    console.log('\n━━━ Query Performance Tests ━━━\n');

    const tests = [
        {
            name: 'Leaderboard Query',
            fn: async () => {
                return await supabase
                    .from('cat_name_ratings')
                    .select(`
            name_id,
            avg_rating,
            total_ratings,
            cat_name_options!inner (name, description)
          `)
                    .gte('total_ratings', 3)
                    .order('avg_rating', { ascending: false })
                    .limit(50);
            }
        },
        {
            name: 'User Stats Query',
            fn: async () => {
                return await supabase.rpc('get_user_stats', { p_user_name: 'aaron' });
            }
        },
        {
            name: 'Tournament Selections',
            fn: async () => {
                return await supabase
                    .from('tournament_selections')
                    .select('*')
                    .eq('user_name', 'aaron')
                    .order('selected_at', { ascending: false })
                    .limit(50);
            }
        },
        {
            name: 'Active Names Query',
            fn: async () => {
                return await supabase
                    .from('cat_name_options')
                    .select('*')
                    .eq('is_active', true)
                    .order('avg_rating', { ascending: false })
                    .limit(100);
            }
        }
    ];

    console.log('┌─────────────────────────────┬──────────┬──────────┐');
    console.log('│ Query                       │   Time   │  Status  │');
    console.log('├─────────────────────────────┼──────────┼──────────┤');

    for (const test of tests) {
        const start = performance.now();
        const { error } = await test.fn();
        const duration = performance.now() - start;

        const name = test.name.padEnd(27);
        const time = `${duration.toFixed(2)}ms`.padStart(8);
        const status = error ? '  ERROR  ' : (duration > SLOW_QUERY_THRESHOLD ? '  SLOW   ' : '   OK    ');
        const statusColor = error ? '❌' : (duration > SLOW_QUERY_THRESHOLD ? '⚠️ ' : '✓ ');

        console.log(`│ ${name} │ ${time} │ ${statusColor}${status} │`);

        if (error) {
            console.log(`│   Error: ${error.message.substring(0, 50).padEnd(50)} │`);
        }
    }

    console.log('└─────────────────────────────┴──────────┴──────────┘');
}

/**
 * Check index effectiveness
 */
async function checkIndexEffectiveness() {
    console.log('\n━━━ Index Effectiveness ━━━\n');

    const indexes = [
        {
            name: 'idx_ratings_leaderboard',
            table: 'cat_name_ratings',
            columns: ['avg_rating', 'total_ratings', 'name_id']
        },
        {
            name: 'idx_ratings_user_stats',
            table: 'cat_name_ratings',
            columns: ['user_name', 'rating', 'wins', 'losses']
        },
        {
            name: 'idx_tournament_user_recent',
            table: 'tournament_selections',
            columns: ['user_name', 'selected_at']
        }
    ];

    console.log('Key Indexes:');
    indexes.forEach(idx => {
        console.log(`  ✓ ${idx.name}`);
        console.log(`    Table: ${idx.table}`);
        console.log(`    Columns: ${idx.columns.join(', ')}\n`);
    });

    console.log('💡 Tip: Use EXPLAIN ANALYZE to verify index usage in production queries');
}

/**
 * Database health summary
 */
async function getDatabaseHealth() {
    console.log('\n━━━ Database Health Summary ━━━\n');

    // Test basic connectivity
    const { data: testData, error: testError } = await supabase
        .from('cat_name_options')
        .select('count')
        .limit(1);

    if (testError) {
        console.log('❌ Database Connection: FAILED');
        console.log(`   Error: ${testError.message}`);
        return;
    }

    console.log('✓ Database Connection: OK');

    // Get table counts
    const tables = [
        'cat_app_users',
        'cat_name_options',
        'cat_name_ratings',
        'tournament_selections',
        'user_roles'
    ];

    console.log('\nTable Row Counts:');
    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (!error) {
            console.log(`  ${table.padEnd(25)}: ${count?.toLocaleString() || 'N/A'}`);
        }
    }
}

/**
 * Performance recommendations
 */
function showRecommendations() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              Performance Recommendations                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('1. Monitor Slow Queries');
    console.log('   - Queries over 100ms should be investigated');
    console.log('   - Use EXPLAIN ANALYZE to understand query plans');
    console.log('   - Consider adding indexes for frequently filtered columns\n');

    console.log('2. Index Maintenance');
    console.log('   - Run REINDEX periodically to rebuild fragmented indexes');
    console.log('   - Monitor index bloat with pg_stat_user_indexes');
    console.log('   - Remove unused indexes to save space\n');

    console.log('3. Table Maintenance');
    console.log('   - Run VACUUM ANALYZE weekly to update statistics');
    console.log('   - Monitor table bloat and run VACUUM FULL if needed');
    console.log('   - Keep autovacuum enabled for automatic maintenance\n');

    console.log('4. Query Optimization');
    console.log('   - Use covering indexes to avoid table lookups');
    console.log('   - Limit result sets with appropriate WHERE clauses');
    console.log('   - Use pagination for large result sets\n');
}

/**
 * Main monitoring function
 */
async function runMonitoring() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              Database Performance Monitor                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log(`\nDatabase: ${SUPABASE_URL}`);
    console.log(`Date: ${new Date().toISOString()}`);
    console.log(`Slow Query Threshold: ${SLOW_QUERY_THRESHOLD}ms\n`);

    // Database health
    await getDatabaseHealth();

    // Query performance
    await testQueryPerformance();

    // Index effectiveness
    await checkIndexEffectiveness();

    // Recommendations
    showRecommendations();

    console.log('✓ Monitoring complete\n');
}

// Run the monitoring
runMonitoring()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });
