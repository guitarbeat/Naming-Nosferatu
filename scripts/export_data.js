const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Source Project Config (vibe-coded)
const SOURCE_URL = 'https://ocghxwwwuubgmwsxgyoy.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ2h4d3d3dXViZ213c3hneW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTgzMjksImV4cCI6MjA2NTY3NDMyOX0.93cpwT3YCC5GTwhlw4YAzSBgtxbp6fGkjcfqzdKX4E0';

const supabase = createClient(SOURCE_URL, SOURCE_KEY);

const TABLES = [
    'cat_name_options',
    'cat_app_users',
    'cat_name_ratings',
    'tournament_selections',
    'site_settings'
];

async function fetchAll(table) {
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    console.log(`Fetching ${table}...`);

    while (hasMore) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error(`Error fetching ${table}:`, error);
            break;
        }

        if (data.length > 0) {
            allData = allData.concat(data);
            process.stdout.write(`\rFetched ${allData.length} rows...`);
            page++;
            if (data.length < pageSize) hasMore = false;
        } else {
            hasMore = false;
        }
    }
    console.log(`\nDone. Total: ${allData.length}`);
    return allData;
}

async function main() {
    for (const table of TABLES) {
        const data = await fetchAll(table);
        fs.writeFileSync(
            path.join(__dirname, 'data', `${table}.json`),
            JSON.stringify(data, null, 2)
        );
    }
    console.log('Export complete!');
}

main();
