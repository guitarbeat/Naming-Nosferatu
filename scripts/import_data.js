const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Target Project Config (Read from .env.local)
const TARGET_URL = process.env.VITE_SUPABASE_URL;
const TARGET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST use service role key to bypass RLS

if (!TARGET_URL || !TARGET_KEY) {
    console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
    process.exit(1);
}

const supabase = createClient(TARGET_URL, TARGET_KEY);

async function main() {
    const sqlPath = path.join(__dirname, 'import_data.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('Error: scripts/import_data.sql not found. Run generate_migration_sql.js first.');
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by statement to avoid sending too large a payload
    const statements = sql.split('ON CONFLICT DO NOTHING;').filter(s => s.trim().length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + 'ON CONFLICT DO NOTHING;';
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement }); // Assuming you have an exec_sql function or use a different method

        // Since we don't have a generic exec_sql RPC by default, we'll use the REST API if possible, 
        // but for raw SQL import, it's often better to use the CLI.
        // This script assumes you might have a helper or just want to log it.

        // ACTUALLY: The best way to run this without an RPC is to use the Supabase CLI:
        // npx supabase db push

        // So this script is more of a placeholder or needs a specific setup.
        // Let's update it to just warn the user to use the CLI.
    }

    console.log('NOTE: To execute this SQL reliably, use the Supabase CLI:');
    console.log('supabase db reset --db-url <YOUR_DB_CONNECTION_STRING>');
    console.log('psql -h ... -f scripts/import_data.sql');
}

main();
