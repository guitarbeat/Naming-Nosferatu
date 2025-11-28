
import { createClient } from '@supabase/supabase-js';

// Source: vibe-coded
const SOURCE_URL = 'https://ocghxwwwuubgmwsxgyoy.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ2h4d3d3dXViZ213c3hneW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTgzMjksImV4cCI6MjA2NTY3NDMyOX0.93cpwT3YCC5GTwhlw4YAzSBgtxbp6fGkjcfqzdKX4E0';

// Target: Naming-Nosferatu
const TARGET_URL = 'https://dawyeuihunoilzrsnpvt.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhd3lldWlodW5vaWx6cnNucHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTk1MzksImV4cCI6MjA3OTgzNTUzOX0.Td7DY9WXalMd_JT0jG2w-xfoCIxHscQtsUbiiFLqyQI';

const sourceClient = createClient(SOURCE_URL, SOURCE_KEY);
const targetClient = createClient(TARGET_URL, TARGET_KEY);

async function migrateTable(tableName, idField = 'id') {
    console.log(`Migrating ${tableName}...`);

    // Fetch all data from source
    const { data: sourceData, error: sourceError } = await sourceClient
        .from(tableName)
        .select('*');

    if (sourceError) {
        console.error(`Error fetching ${tableName} from source:`, sourceError);
        return;
    }

    console.log(`Fetched ${sourceData.length} rows from ${tableName}`);

    if (sourceData.length > 0) {
        console.log('Sample row keys:', Object.keys(sourceData[0]));
    }

    if (sourceData.length === 0) return;

    // Insert into target in chunks
    const chunkSize = 100;
    for (let i = 0; i < sourceData.length; i += chunkSize) {
        const chunk = sourceData.slice(i, i + chunkSize);

        const { error: targetError } = await targetClient
            .from(tableName)
            .upsert(chunk, { onConflict: idField });

        if (targetError) {
            console.error(`Error inserting chunk ${i} into ${tableName}:`, targetError);
        } else {
            console.log(`Inserted chunk ${i} - ${Math.min(i + chunkSize, sourceData.length)}`);
        }
    }
}

async function runMigration() {
    try {
        // 1. cat_name_options
        await migrateTable('cat_name_options', 'id');

        // 2. cat_app_users
        await migrateTable('cat_app_users', 'user_name');

        // 3. cat_name_ratings
        await migrateTable('cat_name_ratings', 'id');

        // 4. tournament_selections
        await migrateTable('tournament_selections', 'id');

        // 5. site_settings
        await migrateTable('site_settings', 'key');

        console.log('Migration completed!');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

runMigration();
