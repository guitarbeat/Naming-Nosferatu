# Supabase Migration Guide

This guide documents how to migrate the `vibe-coded` project to a new Supabase project.

## Prerequisites

1.  **Supabase CLI**: Ensure you have the Supabase CLI installed (`npm install -g supabase`).
2.  **Docker**: Required for local development and testing.
3.  **Credentials**: You need the `SUPABASE_ACCESS_TOKEN` and the database passwords for both the source and target projects.

## Step 1: Schema Migration

The most reliable way to migrate the schema is using the Supabase CLI to diff the changes.

1.  **Login**: `supabase login`
2.  **Link Source**: Link your local project to the *source* project (`vibe-coded`).
    ```bash
    supabase link --project-ref ocghxwwwuubgmwsxgyoy
    ```
3.  **Pull Schema**: Pull the current schema from the source.
    ```bash
    supabase db pull
    ```
    This will create a migration file in `supabase/migrations`.
4.  **Link Target**: Link your local project to the *target* project.
    ```bash
    supabase link --project-ref <NEW_PROJECT_ID>
    ```
5.  **Push Schema**: Apply the migration to the new project.
    ```bash
    supabase db push
    ```

## Step 2: Data Migration

We have created a set of scripts to automate the data migration.

### 1. Export Data
Run the export script to fetch all data from the source project and save it as JSON files in `scripts/data/`.
```bash
node scripts/export_data.js
```

### 2. Generate SQL
Run the SQL generation script to convert the JSON data into optimized SQL `INSERT` statements. This handles:
*   Preserving UUIDs
*   Handling JSONB columns
*   Batching large tables
```bash
node scripts/generate_migration_sql.js
```

### 3. Import Data
Run the import script to execute the generated SQL against the target database.
```bash
node scripts/import_data.js
```

## Step 3: Post-Migration Verification

1.  **Row Counts**: Run the verification script to compare row counts between source and target.
    ```bash
    node scripts/verify_migration.js
    ```
2.  **App Testing**: Update `.env.local` to point to the new project and manually test the application.

## Troubleshooting

*   **RLS Errors**: The import script uses the service role key to bypass RLS. Ensure your target project's service role key is correctly set in `.env`.
*   **Foreign Key Violations**: The scripts import tables in the correct order (`cat_name_options` -> `cat_app_users` -> `cat_name_ratings`, etc.) to avoid FK issues.
