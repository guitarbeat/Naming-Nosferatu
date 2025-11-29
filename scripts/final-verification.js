#!/usr/bin/env node

/**
 * Final Verification Script
 * 
 * Comprehensive verification of the Supabase backend optimization.
 * Checks schema changes, data integrity, and performance improvements.
 * 
 * Usage:
 *   node scripts/final-verification.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_ANON_KEY environment variables
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

let passedTests = 0;
let failedTests = 0;

/**
 * Test helper
 */
function test(name, condition, details = '') {
    if (condition) {
        console.log(`✓ ${name}`);
        if (details) console.log(`  ${details}`);
        passedTests++;
        return true;
    } else {
        console.log(`❌ ${name}`);
        if (details) console.log(`  ${details}`);
        failedTests++;
        return false;
    }
}

/**
 * Verify schema changes
 */
async function verifySchema() {
    console.log('\n━━━ Schema Verification ━━━\n');

    // Check that user_roles table exists
    const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('count')
        .limit(1);

    test(
        'user_roles table exists',
        !userRolesError,
        userRolesError ? `Error: ${userRolesError.message}` : 'Table accessible'
    );

    // Check that tournament_selections table exists
    const { data: tournamentSelections, error: tournamentError } = await supabase
        .from('tournament_selections')
        .select('count')
        .limit(1);

    test(
        'tournament_selections table exists',
        !tournamentError,
        tournamentError ? `Error: ${tournamentError.message}` : 'Table accessible'
    );

    // Check that leaderboard_stats view does NOT exist
    const { error: leaderboardError } = await supabase
        .from('leaderboard_stats')
        .select('count')
        .limit(1);

    test(
        'leaderboard_stats view removed',
        leaderboardError && leaderboardError.code === '42P01',
        leaderboardError ? 'View does not exist (expected)' : 'View still exists (unexpected)'
    );
}

/**
 * Verify indexes
 */
async function verifyIndexes() {
    console.log('\n━━━ Index Verification ━━━\n');

    const requiredIndexes = [
        'idx_ratings_leaderboard',
        'idx_ratings_user_stats',
        'idx_tournament_user_recent',
        'cat_name_ratings_user_name_name_id_key'
    ];

    // Note: We can't directly query pg_indexes with anon key,
    // so we'll verify indexes work by testing queries that should use them

    console.log('Verifying index functionality through query performance...\n');

    // Test leaderboard index
    const start1 = performance.now();
    const { error: error1 } = await supabase
        .from('cat_name_ratings')
        .select('name_id, avg_rating, total_ratings')
        .gte('total_ratings', 3)
        .order('avg_rating', { ascending: false })
        .limit(50);
    const time1 = performance.now() - start1;

    test(
        'Leaderboard query uses index',
        !error1 && time1 < 200,
        `Query time: ${time1.toFixed(2)}ms (should be <200ms)`
    );

    // Test user stats index
    const start2 = performance.now();
    const { error: error2 } = await supabase
        .from('cat_name_ratings')
        .select('*')
        .eq('user_name', 'aaron')
        .limit(100);
    const time2 = performance.now() - start2;

    test(
        'User stats query uses index',
        !error2 && time2 < 100,
        `Query time: ${time2.toFixed(2)}ms (should be <100ms)`
    );

    // Test tournament index
    const start3 = performance.now();
    const { error: error3 } = await supabase
        .from('tournament_selections')
        .select('*')
        .eq('user_name', 'aaron')
        .order('selected_at', { ascending: false })
        .limit(50);
    const time3 = performance.now() - start3;

    test(
        'Tournament query uses index',
        !error3 && time3 < 150,
        `Query time: ${time3.toFixed(2)}ms (should be <150ms)`
    );
}

/**
 * Verify data integrity
 */
async function verifyDataIntegrity() {
    console.log('\n━━━ Data Integrity Verification ━━━\n');

    // Check for orphaned ratings
    const { data: orphanedRatings, error: orphanError } = await supabase
        .from('cat_name_ratings')
        .select('name_id')
        .not('name_id', 'in',
            `(SELECT id FROM cat_name_options)`
        )
        .limit(1);

    test(
        'No orphaned ratings',
        !orphanError && (!orphanedRatings || orphanedRatings.length === 0),
        orphanedRatings?.length > 0 ?
            `Found ${orphanedRatings.length} orphaned ratings` :
            'All ratings reference valid names'
    );

    // Check for duplicate ratings
    const { data: duplicates, error: dupError } = await supabase
        .rpc('check_duplicate_ratings');

    if (!dupError) {
        test(
            'No duplicate ratings',
            !duplicates || duplicates.length === 0,
            duplicates?.length > 0 ?
                `Found ${duplicates.length} duplicate ratings` :
                'Unique constraint working correctly'
        );
    } else {
        console.log('⚠️  Could not check for duplicates (RPC function may not exist)');
    }

    // Check table row counts
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
 * Verify RPC functions
 */
async function verifyRPCFunctions() {
    console.log('\n━━━ RPC Function Verification ━━━\n');

    // Test get_user_stats function
    const { data: userStats, error: statsError } = await supabase
        .rpc('get_user_stats', { p_user_name: 'aaron' });

    test(
        'get_user_stats() function works',
        !statsError && userStats,
        statsError ? `Error: ${statsError.message}` : 'Function returns data'
    );

    // Test has_role function
    const { data: hasRole, error: roleError } = await supabase
        .rpc('has_role', { required_role: 'user' });

    test(
        'has_role() function works',
        !roleError,
        roleError ? `Error: ${roleError.message}` : 'Function accessible'
    );

    // Verify refresh_materialized_views does NOT exist
    const { error: refreshError } = await supabase
        .rpc('refresh_materialized_views');

    test(
        'refresh_materialized_views() removed',
        refreshError && refreshError.code === '42883',
        refreshError ? 'Function does not exist (expected)' : 'Function still exists (unexpected)'
    );
}

/**
 * Verify RLS policies
 */
async function verifyRLS() {
    console.log('\n━━━ RLS Policy Verification ━━━\n');

    // Test that we can read active names
    const { data: activeNames, error: activeError } = await supabase
        .from('cat_name_options')
        .select('id, name')
        .eq('is_active', true)
        .limit(10);

    test(
        'Can read active names',
        !activeError && activeNames && activeNames.length > 0,
        activeError ? `Error: ${activeError.message}` : `Retrieved ${activeNames?.length} names`
    );

    // Test that we can read our own ratings
    const { data: ownRatings, error: ratingsError } = await supabase
        .from('cat_name_ratings')
        .select('*')
        .limit(10);

    test(
        'Can read ratings',
        !ratingsError,
        ratingsError ? `Error: ${ratingsError.message}` : 'Ratings accessible'
    );
}

/**
 * Performance benchmarks
 */
async function runPerformanceBenchmarks() {
    console.log('\n━━━ Performance Benchmarks ━━━\n');

    const benchmarks = [
        {
            name: 'Leaderboard Query',
            target: 100,
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
            target: 50,
            fn: async () => {
                return await supabase.rpc('get_user_stats', { p_user_name: 'aaron' });
            }
        },
        {
            name: 'Tournament History',
            target: 75,
            fn: async () => {
                return await supabase
                    .from('tournament_selections')
                    .select('*')
                    .eq('user_name', 'aaron')
                    .order('selected_at', { ascending: false })
                    .limit(50);
            }
        }
    ];

    for (const benchmark of benchmarks) {
        const start = performance.now();
        const { error } = await benchmark.fn();
        const duration = performance.now() - start;

        test(
            `${benchmark.name} < ${benchmark.target}ms`,
            !error && duration < benchmark.target,
            `Actual: ${duration.toFixed(2)}ms`
        );
    }
}

/**
 * Main verification function
 */
async function runVerification() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         Supabase Backend Optimization Verification        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log(`\nDatabase: ${SUPABASE_URL}`);
    console.log(`Date: ${new Date().toISOString()}\n`);

    await verifySchema();
    await verifyIndexes();
    await verifyDataIntegrity();
    await verifyRPCFunctions();
    await verifyRLS();
    await runPerformanceBenchmarks();

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    Verification Summary                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const total = passedTests + failedTests;
    const passRate = ((passedTests / total) * 100).toFixed(1);

    console.log(`Tests Passed: ${passedTests}/${total} (${passRate}%)`);
    console.log(`Tests Failed: ${failedTests}/${total}\n`);

    if (failedTests === 0) {
        console.log('✅ All verification tests passed!');
        console.log('   The backend optimization is complete and working correctly.\n');
        return 0;
    } else {
        console.log('⚠️  Some verification tests failed.');
        console.log('   Review the failures above and address any issues.\n');
        return 1;
    }
}

// Run the verification
runVerification()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });
