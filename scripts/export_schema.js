#!/usr/bin/env node
/**
 * Export Database Schema
 * 
 * This script exports the complete database schema including:
 * - Tables structure
 * - Indexes
 * - Constraints
 * - Functions
 * - Policies
 * - Views
 * 
 * Usage: node scripts/export_schema.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exportSchema() {
    console.log('Exporting database schema...\n');
    
    const schema = {
        exported_at: new Date().toISOString(),
        database_url: SUPABASE_URL,
        tables: [],
        indexes: [],
        constraints: [],
        functions: [],
        policies: [],
        views: []
    };

    try {
        // Export Tables
        console.log('Fetching tables...');
        const { data: tables, error: tablesError } = await supabase.rpc('get_schema_tables');
        
        if (tablesError) {
            console.warn('Could not fetch tables via RPC. Using information_schema query...');
            // Fallback: Query information_schema directly
            const { data: tablesData, error: fallbackError } = await supabase
                .from('information_schema.tables')
                .select('*')
                .eq('table_schema', 'public');
            
            if (!fallbackError && tablesData) {
                schema.tables = tablesData;
                console.log(`✓ Found ${tablesData.length} tables`);
            }
        } else {
            schema.tables = tables;
            console.log(`✓ Found ${tables?.length || 0} tables`);
        }

        // Export Indexes
        console.log('Fetching indexes...');
        const { data: indexes, error: indexesError } = await supabase.rpc('get_schema_indexes');
        
        if (!indexesError && indexes) {
            schema.indexes = indexes;
            console.log(`✓ Found ${indexes.length} indexes`);
        } else {
            console.warn('Could not fetch indexes');
        }

        // Export Constraints
        console.log('Fetching constraints...');
        const { data: constraints, error: constraintsError } = await supabase.rpc('get_schema_constraints');
        
        if (!constraintsError && constraints) {
            schema.constraints = constraints;
            console.log(`✓ Found ${constraints.length} constraints`);
        } else {
            console.warn('Could not fetch constraints');
        }

        // Export Functions
        console.log('Fetching functions...');
        const { data: functions, error: functionsError } = await supabase.rpc('get_schema_functions');
        
        if (!functionsError && functions) {
            schema.functions = functions;
            console.log(`✓ Found ${functions.length} functions`);
        } else {
            console.warn('Could not fetch functions');
        }

        // Export RLS Policies
        console.log('Fetching RLS policies...');
        const { data: policies, error: policiesError } = await supabase.rpc('get_schema_policies');
        
        if (!policiesError && policies) {
            schema.policies = policies;
            console.log(`✓ Found ${policies.length} policies`);
        } else {
            console.warn('Could not fetch policies');
        }

        // Export Views
        console.log('Fetching views...');
        const { data: views, error: viewsError } = await supabase.rpc('get_schema_views');
        
        if (!viewsError && views) {
            schema.views = views;
            console.log(`✓ Found ${views.length} views`);
        } else {
            console.warn('Could not fetch views');
        }

        // Save to file
        const outputDir = path.join(__dirname, 'data');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, 'schema_export.json');
        fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
        
        console.log(`\n✓ Schema exported to: ${outputPath}`);
        
        // Also create a human-readable summary
        const summaryPath = path.join(outputDir, 'schema_summary.txt');
        const summary = `
Database Schema Export Summary
==============================
Exported: ${schema.exported_at}
Database: ${SUPABASE_URL}

Tables: ${schema.tables.length}
Indexes: ${schema.indexes.length}
Constraints: ${schema.constraints.length}
Functions: ${schema.functions.length}
RLS Policies: ${schema.policies.length}
Views: ${schema.views.length}

Tables List:
${schema.tables.map(t => `  - ${t.table_name || t.tablename || 'unknown'}`).join('\n')}
`;
        
        fs.writeFileSync(summaryPath, summary);
        console.log(`✓ Summary saved to: ${summaryPath}`);
        
        return schema;
        
    } catch (error) {
        console.error('Error exporting schema:', error);
        throw error;
    }
}

// Alternative: Use pg_dump for complete schema export
function printPgDumpInstructions() {
    console.log('\n' + '='.repeat(60));
    console.log('RECOMMENDED: Use pg_dump for complete schema export');
    console.log('='.repeat(60));
    console.log('\nFor a complete schema export including all DDL, use pg_dump:');
    console.log('\n  pg_dump -h <host> -U postgres -d postgres \\');
    console.log('    --schema-only \\');
    console.log('    --no-owner \\');
    console.log('    --no-privileges \\');
    console.log('    -f scripts/data/schema_backup.sql\n');
    console.log('Or via Supabase CLI:');
    console.log('\n  supabase db dump --schema public > scripts/data/schema_backup.sql\n');
    console.log('='.repeat(60) + '\n');
}

// Main execution
if (require.main === module) {
    printPgDumpInstructions();
    
    exportSchema()
        .then(() => {
            console.log('\n✓ Schema export complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n✗ Schema export failed:', error.message);
            process.exit(1);
        });
}

module.exports = { exportSchema };
