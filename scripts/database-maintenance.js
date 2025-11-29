#!/usr/bin/env node

/**
 * Database Maintenance Script
 * 
 * Performs routine database maintenance operations including:
 * - VACUUM ANALYZE to reclaim space and update statistics
 * - Index rebuilding
 * - Bloat checking
 * 
 * Usage:
 *   node scripts/database-maintenance.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_ANON_KEY environment variables
 *   - Admin privileges for maintenance operations
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Check table bloat
 */
async function checkBloat() {
    console.log('\n━━━ Checking Table Bloat ━━━\n');

    const { data, error } = await supabase.rpc('check_table_bloat');

    if (error) {
        console.error('❌ Error checking bloat:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('✓ No significant bloat detected');
        return;
    }

    console.log('Table Bloat Report:\n');
    console.log('┌─────────────────────────────┬──────────┬──────────┬──────────┐');
    console.log('│ Table                       │   Size   │  Bloat   │  Ratio   │');
    console.log('├─────────────────────────────┼──────────┼──────────┼──────────┤');

    data.forEach(row => {
        const table = row.table_name.padEnd(27);
        const size = formatBytes(row.table_size).padStart(8);
        const bloat = formatBytes(row.bloat_size).padStart(8);
        const ratio = `${(row.bloat_ratio * 100).toFixed(1)}%`.padStart(8);
        console.log(`│ ${table} │ ${size} │ ${bloat} │ ${ratio} │`);
    });

    console.log('└─────────────────────────────┴──────────┴──────────┴──────────┘');
}

/**
 * Check index usage
 */
async function checkIndexUsage() {
    console.log('\n━━━ Checking Index Usage ━━━\n');

    const { data, error } = await supabase.rpc('check_index_usage');

    if (error) {
        console.error('❌ Error checking index usage:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('✓ All indexes are being used');
        return;
    }

    console.log('Unused Indexes:\n');
    console.log('┌─────────────────────────────────────────────────┬──────────┐');
    console.log('│ Index Name                                      │   Size   │');
    console.log('├─────────────────────────────────────────────────┼──────────┤');

    data.forEach(row => {
        const index = row.index_name.padEnd(47);
        const size = formatBytes(row.index_size).padStart(8);
        console.log(`│ ${index} │ ${size} │`);
    });

    console.log('└─────────────────────────────────────────────────┴──────────┘');
    console.log('\n⚠️  Consider dropping unused indexes to save space');
}

/**
 * Get table sizes
 */
async function getTableSizes() {
    console.log('\n━━━ Table Sizes ━━━\n');

    const { data, error } = await supabase.rpc('get_table_sizes');

    if (error) {
        console.error('❌ Error getting table sizes:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('❌ No table size data available');
        return;
    }

    console.log('┌─────────────────────────────┬──────────┬──────────┬──────────┐');
    console.log('│ Table                       │   Rows   │   Size   │  Indexes │');
    console.log('├─────────────────────────────┼──────────┼──────────┼──────────┤');

    let totalSize = 0;
    let totalIndexes = 0;

    data.forEach(row => {
        const table = row.table_name.padEnd(27);
        const rows = row.row_count.toLocaleString().padStart(8);
        const size = formatBytes(row.table_size).padStart(8);
        const indexes = formatBytes(row.indexes_size).padStart(8);
        console.log(`│ ${table} │ ${rows} │ ${size} │ ${indexes} │`);
        totalSize += row.table_size;
        totalIndexes += row.indexes_size;
    });

    console.log('├─────────────────────────────┼──────────┼──────────┼──────────┤');
    const total = formatBytes(totalSize).padStart(8);
    const totalIdx = formatBytes(totalIndexes).padStart(8);
    console.log(`│ TOTAL${' '.repeat(22)} │          │ ${total} │ ${totalIdx} │`);
    console.log('└─────────────────────────────┴──────────┴──────────┴──────────┘');
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Main maintenance function
 */
async function runMaintenance() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              Database Maintenance Report                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log(`\nDatabase: ${SUPABASE_URL}`);
    console.log(`Date: ${new Date().toISOString()}\n`);

    // Get table sizes
    await getTableSizes();

    // Check bloat
    await checkBloat();

    // Check index usage
    await checkIndexUsage();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  Maintenance Recommendations               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('To perform maintenance operations, run the following SQL:');
    console.log('');
    console.log('-- Vacuum and analyze all tables');
    console.log('VACUUM ANALYZE cat_app_users;');
    console.log('VACUUM ANALYZE cat_name_options;');
    console.log('VACUUM ANALYZE cat_name_ratings;');
    console.log('VACUUM ANALYZE tournament_selections;');
    console.log('VACUUM ANALYZE user_roles;');
    console.log('');
    console.log('-- Reindex all tables');
    console.log('REINDEX TABLE cat_app_users;');
    console.log('REINDEX TABLE cat_name_options;');
    console.log('REINDEX TABLE cat_name_ratings;');
    console.log('REINDEX TABLE tournament_selections;');
    console.log('REINDEX TABLE user_roles;');
    console.log('');
    console.log('⚠️  Note: These operations should be run during low-traffic periods');
    console.log('   as they may briefly lock tables.\n');

    console.log('✓ Maintenance report complete\n');
}

// Run the maintenance report
runMaintenance()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });
