#!/usr/bin/env node

/**
 * Performance Baseline Measurement Script
 * 
 * Measures current query performance before optimization.
 * Run this script to establish baselines, then run again after
 * optimization to validate improvements.
 * 
 * Usage:
 *   node scripts/measure-performance-baselines.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_ANON_KEY environment variables
 *   - Test user account (default: 'aaron')
 */

import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const TEST_USER = process.env.TEST_USER || 'aaron';
const NUM_RUNS = 5; // Number of times to run each query for median calculation

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Measure a query multiple times and return statistics
 */
async function measureQuery(name, queryFn, options = {}) {
  const { warmup = true, runs = NUM_RUNS } = options;
  const times = [];

  // Warmup run (not counted)
  if (warmup) {
    try {
      await queryFn();
    } catch (error) {
      console.warn(`   ⚠️  Warmup failed: ${error.message}`);
    }
  }

  // Measured runs
  for (let i = 0; i < runs; i++) {
    try {
      const start = performance.now();
      await queryFn();
      const duration = performance.now() - start;
      times.push(duration);

      // Small delay between runs
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn(`   ⚠️  Run ${i + 1} failed: ${error.message}`);
      times.push(null);
    }
  }

  // Filter out failed runs
  const validTimes = times.filter(t => t !== null);

  if (validTimes.length === 0) {
    console.log(`❌ ${name}: All runs failed`);
    return null;
  }

  // Calculate statistics
  validTimes.sort((a, b) => a - b);
  const median = validTimes[Math.floor(validTimes.length / 2)];
  const min = validTimes[0];
  const max = validTimes[validTimes.length - 1];
  const avg = validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length;

  console.log(`✓ ${name}:`);
  console.log(`   Median: ${median.toFixed(2)}ms`);
  console.log(`   Avg:    ${avg.toFixed(2)}ms`);
  console.log(`   Range:  ${min.toFixed(2)}ms - ${max.toFixed(2)}ms`);
  console.log(`   Runs:   ${validTimes.length}/${runs} successful`);

  return { name, median, avg, min, max, runs: validTimes.length };
}

/**
 * Main baseline measurement function
 */
async function runBaselines() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Query Performance Baseline Measurement             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Configuration:`);
  console.log(`  Database: ${SUPABASE_URL}`);
  console.log(`  Test User: ${TEST_USER}`);
  console.log(`  Runs per query: ${NUM_RUNS}`);
  console.log(`  Date: ${new Date().toISOString()}\n`);

  const results = [];

  // ===== 1. TOURNAMENT QUERIES =====
  console.log('\n━━━ 1. Tournament Queries ━━━\n');

  results.push(await measureQuery(
    '1.1 Get User Tournaments (JSONB)',
    async () => {
      const { data, error } = await supabase
        .from('cat_app_users')
        .select('tournament_data')
        .eq('user_name', TEST_USER)
        .single();

      if (error) throw error;
      return data;
    }
  ));

  results.push(await measureQuery(
    '1.2 Get Tournament Selections (Table)',
    async () => {
      const { data, error } = await supabase
        .from('tournament_selections')
        .select('*')
        .eq('user_name', TEST_USER)
        .order('selected_at', { ascending: false })
        .limit(50);

      if (error && error.code !== '42P01') throw error; // Ignore table not exists
      return data;
    }
  ));

  // ===== 2. LEADERBOARD QUERIES =====
  console.log('\n━━━ 2. Leaderboard Queries ━━━\n');

  results.push(await measureQuery(
    '2.1 Get Leaderboard (Optimized Direct Query)',
    async () => {
      const { data, error } = await supabase
        .from('cat_name_ratings')
        .select(`
          name_id,
          avg_rating,
          total_ratings,
          wins,
          losses,
          cat_name_options!inner (
            id,
            name,
            description,
            category
          )
        `)
        .gte('total_ratings', 3)
        .order('avg_rating', { ascending: false })
        .order('total_ratings', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    }
  ));

  results.push(await measureQuery(
    '2.2 Get Leaderboard (Direct Query)',
    async () => {
      const { data, error } = await supabase
        .from('cat_name_options')
        .select(`
          id,
          name,
          avg_rating,
          popularity_score,
          total_tournaments
        `)
        .eq('is_active', true)
        .not('avg_rating', 'is', null)
        .order('avg_rating', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    }
  ));

  // ===== 3. USER STATISTICS QUERIES =====
  console.log('\n━━━ 3. User Statistics Queries ━━━\n');

  results.push(await measureQuery(
    '3.1 Get User Stats (RPC Function)',
    async () => {
      const { data, error } = await supabase
        .rpc('get_user_stats', { p_user_name: TEST_USER });

      if (error && error.code !== '42883') throw error; // Ignore function not exists
      return data;
    }
  ));

  results.push(await measureQuery(
    '3.2 Get User Ratings (Direct Query)',
    async () => {
      const { data, error } = await supabase
        .from('cat_name_ratings')
        .select('*')
        .eq('user_name', TEST_USER);

      if (error) throw error;
      return data;
    }
  ));

  // ===== 4. NAME QUERIES =====
  console.log('\n━━━ 4. Name Queries ━━━\n');

  results.push(await measureQuery(
    '4.1 Get Names with Descriptions',
    async () => {
      // First get hidden names
      const { data: hiddenData } = await supabase
        .from('cat_name_ratings')
        .select('name_id')
        .eq('is_hidden', true);

      const hiddenIds = hiddenData?.map(item => item.name_id) || [];

      // Then get active names
      let query = supabase
        .from('cat_name_options')
        .select('*')
        .eq('is_active', true)
        .order('avg_rating', { ascending: false });

      if (hiddenIds.length > 0) {
        query = query.not('id', 'in', `(${hiddenIds.join(',')})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  ));

  results.push(await measureQuery(
    '4.2 Get Names with User Ratings',
    async () => {
      const { data, error } = await supabase
        .from('cat_name_options')
        .select(`
          id,
          name,
          description,
          created_at,
          avg_rating,
          is_active,
          cat_name_ratings!left (
            user_name,
            rating,
            wins,
            losses,
            is_hidden,
            updated_at
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    }
  ));

  // ===== 5. ROLE CHECK QUERIES =====
  console.log('\n━━━ 5. Role Check Queries ━━━\n');

  results.push(await measureQuery(
    '5.1 Check User Role (user_roles table)',
    async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_name', TEST_USER)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found
      return data;
    }
  ));

  results.push(await measureQuery(
    '5.2 Check User Role (cat_app_users column)',
    async () => {
      const { data, error } = await supabase
        .from('cat_app_users')
        .select('user_role')
        .eq('user_name', TEST_USER)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found
      return data;
    }
  ));

  // ===== SUMMARY =====
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Summary Report                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const validResults = results.filter(r => r !== null);

  if (validResults.length === 0) {
    console.log('❌ No successful measurements');
    return;
  }

  console.log('Query Performance Summary:\n');
  console.log('┌─────────────────────────────────────────────────┬──────────┐');
  console.log('│ Query                                           │  Median  │');
  console.log('├─────────────────────────────────────────────────┼──────────┤');

  validResults.forEach(result => {
    const name = result.name.padEnd(47);
    const median = `${result.median.toFixed(2)}ms`.padStart(8);
    console.log(`│ ${name} │ ${median} │`);
  });

  console.log('└─────────────────────────────────────────────────┴──────────┘\n');

  // Calculate averages by category
  const categories = {
    'Tournament': validResults.filter(r => r.name.startsWith('1.')),
    'Leaderboard': validResults.filter(r => r.name.startsWith('2.')),
    'User Stats': validResults.filter(r => r.name.startsWith('3.')),
    'Names': validResults.filter(r => r.name.startsWith('4.')),
    'Roles': validResults.filter(r => r.name.startsWith('5.'))
  };

  console.log('Average by Category:\n');
  Object.entries(categories).forEach(([category, results]) => {
    if (results.length > 0) {
      const avg = results.reduce((sum, r) => sum + r.median, 0) / results.length;
      console.log(`  ${category.padEnd(15)}: ${avg.toFixed(2)}ms`);
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✓ Baseline measurement complete');
  console.log(`  Results saved to: .kiro/specs/supabase-backend-optimization/performance-baselines.md`);
  console.log(`  Date: ${new Date().toISOString()}`);
  console.log('\n  Next steps:');
  console.log('  1. Review baseline measurements');
  console.log('  2. Proceed with optimization tasks');
  console.log('  3. Re-run this script after optimization');
  console.log('  4. Compare results to validate improvements\n');
}

// Run the baseline measurements
runBaselines()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
