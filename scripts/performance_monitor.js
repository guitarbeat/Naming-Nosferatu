#!/usr/bin/env node
/**
 * Performance Monitoring Utility
 * 
 * Monitors and logs query performance for the Supabase backend
 * Usage: node scripts/performance_monitor.js [options]
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Performance monitoring configuration
const config = {
    logFile: path.join(__dirname, 'data', 'performance_log.json'),
    slowQueryThreshold: 100, // ms
    enableDetailedLogging: true,
    sampleSize: 10 // Number of iterations for each query
};

// Test queries to monitor
const testQueries = {
    // Tournament queries
    getUserTournaments: async (userName) => {
        const start = Date.now();
        const { data, error } = await supabase
            .from('tournament_selections')
            .select('*')
            .eq('user_name', userName)
            .order('created_at', { ascending: false })
            .limit(20);
        const duration = Date.now() - start;
        return { duration, rowCount: data?.length || 0, error };
    },

    // Leaderboard queries
    getLeaderboard: async () => {
        const start = Date.now();
        const { data, error } = await supabase
            .from('cat_name_options')
            .select(`
                id,
                name,
                description,
                avg_rating,
                cat_name_ratings (
                    rating,
                    wins,
                    losses
                )
            `)
            .eq('is_active', true)
            .order('avg_rating', { ascending: false, nullsFirst: false })
            .limit(50);
        const duration = Date.now() - start;
        return { duration, rowCount: data?.length || 0, error };
    },

    // User stats queries
    getUserStats: async (userName) => {
        const start = Date.now();
        const { data, error } = await supabase
            .from('cat_name_ratings')
            .select('rating, wins, losses, is_hidden')
            .eq('user_name', userName);
        const duration = Date.now() - start;
        return { duration, rowCount: data?.length || 0, error };
    },

    // Name search queries
    searchNames: async (searchTerm) => {
        const start = Date.now();
        const { data, error } = await supabase
            .from('cat_name_options')
            .select('id, name, description, avg_rating')
            .ilike('name', `%${searchTerm}%`)
            .eq('is_active', true)
            .limit(20);
        const duration = Date.now() - start;
        return { duration, rowCount: data?.length || 0, error };
    },

    // Rating update queries
    updateRating: async (userName, nameId, rating) => {
        const start = Date.now();
        const { data, error } = await supabase
            .from('cat_name_ratings')
            .upsert({
                user_name: userName,
                name_id: nameId,
                rating: rating,
                wins: 0,
                losses: 0,
                updated_at: new Date().toISOString()
            });
        const duration = Date.now() - start;
        return { duration, rowCount: 1, error };
    }
};

// Performance metrics
class PerformanceMetrics {
    constructor() {
        this.metrics = {};
    }

    record(queryName, duration, rowCount, error) {
        if (!this.metrics[queryName]) {
            this.metrics[queryName] = {
                count: 0,
                totalDuration: 0,
                minDuration: Infinity,
                maxDuration: 0,
                avgDuration: 0,
                slowQueries: 0,
                errors: 0,
                samples: []
            };
        }

        const metric = this.metrics[queryName];
        metric.count++;
        metric.totalDuration += duration;
        metric.minDuration = Math.min(metric.minDuration, duration);
        metric.maxDuration = Math.max(metric.maxDuration, duration);
        metric.avgDuration = metric.totalDuration / metric.count;
        
        if (duration > config.slowQueryThreshold) {
            metric.slowQueries++;
        }
        
        if (error) {
            metric.errors++;
        }

        metric.samples.push({
            duration,
            rowCount,
            timestamp: new Date().toISOString(),
            error: error ? error.message : null
        });

        // Keep only last 100 samples
        if (metric.samples.length > 100) {
            metric.samples.shift();
        }
    }

    getSummary() {
        return Object.entries(this.metrics).map(([name, metric]) => ({
            query: name,
            count: metric.count,
            avgDuration: Math.round(metric.avgDuration),
            minDuration: metric.minDuration,
            maxDuration: metric.maxDuration,
            slowQueries: metric.slowQueries,
            errors: metric.errors,
            status: this.getStatus(metric)
        }));
    }

    getStatus(metric) {
        if (metric.errors > 0) return '❌ ERROR';
        if (metric.avgDuration > config.slowQueryThreshold * 2) return '🔴 SLOW';
        if (metric.avgDuration > config.slowQueryThreshold) return '🟡 WARNING';
        return '✅ GOOD';
    }

    save() {
        const outputDir = path.dirname(config.logFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const report = {
            timestamp: new Date().toISOString(),
            config,
            summary: this.getSummary(),
            details: this.metrics
        };

        fs.writeFileSync(config.logFile, JSON.stringify(report, null, 2));
        console.log(`\n✓ Performance log saved to: ${config.logFile}`);
    }
}

// Get test data
async function getTestData() {
    // Get a real user for testing
    const { data: users } = await supabase
        .from('cat_app_users')
        .select('user_name')
        .limit(1);

    // Get a real name for testing
    const { data: names } = await supabase
        .from('cat_name_options')
        .select('id, name')
        .eq('is_active', true)
        .limit(1);

    return {
        userName: users?.[0]?.user_name || 'test_user',
        nameId: names?.[0]?.id || '00000000-0000-0000-0000-000000000000',
        searchTerm: names?.[0]?.name?.substring(0, 3) || 'cat'
    };
}

// Run performance tests
async function runPerformanceTests() {
    console.log('========================================');
    console.log('Performance Monitoring');
    console.log('========================================');
    console.log(`Database: ${SUPABASE_URL}`);
    console.log(`Sample Size: ${config.sampleSize} iterations per query`);
    console.log(`Slow Query Threshold: ${config.slowQueryThreshold}ms`);
    console.log('');

    const metrics = new PerformanceMetrics();
    const testData = await getTestData();

    console.log('Test Data:');
    console.log(`  User: ${testData.userName}`);
    console.log(`  Name ID: ${testData.nameId}`);
    console.log(`  Search Term: ${testData.searchTerm}`);
    console.log('');

    // Run each query multiple times
    const queries = [
        { name: 'getUserTournaments', fn: () => testQueries.getUserTournaments(testData.userName) },
        { name: 'getLeaderboard', fn: () => testQueries.getLeaderboard() },
        { name: 'getUserStats', fn: () => testQueries.getUserStats(testData.userName) },
        { name: 'searchNames', fn: () => testQueries.searchNames(testData.searchTerm) }
    ];

    for (const query of queries) {
        process.stdout.write(`Testing ${query.name}... `);
        
        for (let i = 0; i < config.sampleSize; i++) {
            const result = await query.fn();
            metrics.record(query.name, result.duration, result.rowCount, result.error);
            
            // Small delay between queries
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const metric = metrics.metrics[query.name];
        console.log(`✓ (avg: ${Math.round(metric.avgDuration)}ms, rows: ${metric.samples[0].rowCount})`);
    }

    console.log('');
    console.log('========================================');
    console.log('Performance Summary');
    console.log('========================================');
    console.log('');

    const summary = metrics.getSummary();
    
    // Print table
    console.log('Query                    | Avg (ms) | Min (ms) | Max (ms) | Slow | Status');
    console.log('-------------------------|----------|----------|----------|------|--------');
    
    summary.forEach(s => {
        const query = s.query.padEnd(24);
        const avg = String(s.avgDuration).padStart(8);
        const min = String(s.minDuration).padStart(8);
        const max = String(s.maxDuration).padStart(8);
        const slow = String(s.slowQueries).padStart(4);
        console.log(`${query} | ${avg} | ${min} | ${max} | ${slow} | ${s.status}`);
    });

    console.log('');

    // Identify issues
    const slowQueries = summary.filter(s => s.avgDuration > config.slowQueryThreshold);
    const errorQueries = summary.filter(s => s.errors > 0);

    if (slowQueries.length > 0) {
        console.log('⚠️  Slow Queries Detected:');
        slowQueries.forEach(q => {
            console.log(`   - ${q.query}: ${q.avgDuration}ms (threshold: ${config.slowQueryThreshold}ms)`);
        });
        console.log('');
    }

    if (errorQueries.length > 0) {
        console.log('❌ Queries with Errors:');
        errorQueries.forEach(q => {
            console.log(`   - ${q.query}: ${q.errors} errors`);
        });
        console.log('');
    }

    if (slowQueries.length === 0 && errorQueries.length === 0) {
        console.log('✅ All queries performing well!');
        console.log('');
    }

    // Save metrics
    metrics.save();

    return metrics;
}

// Main execution
if (require.main === module) {
    runPerformanceTests()
        .then(() => {
            console.log('Performance monitoring complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error running performance tests:', error);
            process.exit(1);
        });
}

module.exports = { runPerformanceTests, PerformanceMetrics };
