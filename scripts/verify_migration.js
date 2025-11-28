const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Config
const SOURCE_URL = 'https://ocghxwwwuubgmwsxgyoy.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ2h4d3d3dXViZ213c3hneW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTgzMjksImV4cCI6MjA2NTY3NDMyOX0.93cpwT3YCC5GTwhlw4YAzSBgtxbp6fGkjcfqzdKX4E0';

const TARGET_URL = process.env.VITE_SUPABASE_URL;
const TARGET_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const source = createClient(SOURCE_URL, SOURCE_KEY);
const target = createClient(TARGET_URL, TARGET_KEY);

const TABLES = [
    'cat_name_options',
    'cat_app_users',
    'cat_name_ratings',
    'tournament_selections',
    'site_settings'
];

async function getCount(client, table) {
    const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });
    if (error) {
        console.error(`Error counting ${table}:`, error.message);
        return -1;
    }
    return count;
}

async function main() {
    console.log('Verifying migration...');
    console.log('Table\t\tSource\tTarget\tStatus');
    console.log('----------------------------------------');

    for (const table of TABLES) {
        const sourceCount = await getCount(source, table);
        const targetCount = await getCount(target, table);
        const status = sourceCount === targetCount ? '✅ OK' : '❌ MISMATCH';

        console.log(`${table.padEnd(20)}\t${sourceCount}\t${targetCount}\t${status}`);
    }
}

main();
