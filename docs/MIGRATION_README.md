# Database Migration Instructions

## **🚨 Issue Description**

The application is currently experiencing errors because the `preferences` and `tournament_data` columns are missing from the `cat_app_users` table. This causes:

1. **404 errors** when trying to fetch user preferences
2. **React rendering errors** when error objects are displayed directly
3. **Application crashes** when trying to access non-existent columns

## **🔧 Solution**

Run the SQL migration to add the missing columns to your database.

## **📋 Migration Steps**

### **Option 1: Using Supabase CLI (Recommended)**

1. **Start your local Supabase instance:**

   ```bash
   cd /Users/aaron/Downloads/github/name-nosferatu
   supabase start
   ```

2. **Run the migration:**

   ```bash
   supabase db reset
   # OR manually run the SQL:
   supabase db push
   ```

### **Option 2: Manual SQL Execution**

If you can't use the Supabase CLI, you can run the SQL manually:

1. **Connect to your Supabase database** (via Supabase Studio or any PostgreSQL client)

2. **Execute the migration SQL:**

   ```sql
   -- Migration: Add preferences column to cat_app_users table
   -- This migration adds the missing preferences column that the application expects

   -- Add preferences column as JSONB with default value
   ALTER TABLE cat_app_users
   ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
     "preferred_categories": [],
     "tournament_size_preference": 8,
     "rating_display_preference": "elo",
     "sound_enabled": true,
     "theme_preference": "dark"
   }'::jsonb;

   -- Add tournament_data column as JSONB with default value (also mentioned in docs)
   ALTER TABLE cat_app_users
   ADD COLUMN IF NOT EXISTS tournament_data JSONB DEFAULT '[]'::jsonb;

   -- Add comment to document the column purpose
   COMMENT ON COLUMN cat_app_users.preferences IS 'User preferences including theme, sound, tournament settings, and categories';
   COMMENT ON COLUMN cat_app_users.tournament_data IS 'User tournament history and data stored as JSONB array';

   -- Create index on preferences for better query performance
   CREATE INDEX IF NOT EXISTS idx_cat_app_users_preferences ON cat_app_users USING GIN (preferences);

   -- Create index on tournament_data for better query performance
   CREATE INDEX IF NOT EXISTS idx_cat_app_users_tournament_data ON cat_app_users USING GIN (tournament_data);
   ```

## **✅ What This Migration Does**

1. **Adds `preferences` column** - Stores user preferences as JSONB
2. **Adds `tournament_data` column** - Stores tournament history as JSONB
3. **Sets default values** - Ensures existing users have working preferences
4. **Creates indexes** - Improves query performance on JSONB columns
5. **Adds documentation** - Comments explain column purposes

## **🔄 After Migration**

1. **Restart your application** to ensure the new columns are recognized
2. **Test user preferences** - Users should now be able to save/load preferences
3. **Test tournaments** - Tournament creation and retrieval should work
4. **Check console** - No more "column does not exist" errors

## **🚀 Fallback Mechanism**

The application code has been updated with fallback mechanisms that:

- **Return default preferences** when columns don't exist
- **Log helpful warnings** about missing columns
- **Prevent app crashes** during the transition period
- **Gracefully degrade** functionality until migration is complete

## **📊 Verification**

After running the migration, you should see:

- ✅ No more "column does not exist" errors in console
- ✅ User preferences working correctly
- ✅ Tournament data being saved and retrieved
- ✅ Application running without database errors

## **🆘 Troubleshooting**

### **If migration fails:**

- Check that you have write permissions to the database
- Ensure the `cat_app_users` table exists
- Verify your database connection

### **If errors persist:**

- Check the browser console for specific error messages
- Verify the migration SQL executed successfully
- Restart your application after migration

### **Need help?**

- Check the Supabase logs: `supabase logs`
- Review the migration file: `supabase/migrations/add_preferences_column.sql`
- Check the application error handling in the browser console
