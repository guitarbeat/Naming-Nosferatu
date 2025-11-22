# Environment Setup

This guide will help you set up the development environment for Name Nosferatu.

---

## Manual Setup (if needed)

### 1. Create Environment File

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual Supabase credentials:

```bash
# Supabase Configuration
# Get these from: https://supabase.com/dashboard > Your Project > Settings > API
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here

# Alternative environment variable names (for Node.js/Vercel compatibility)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
```

**Note:** The application supports both `VITE_` prefixed variables (for Vite) and direct variable names (for Node.js/Vercel). Environment variables take priority over hardcoded fallbacks.

### 2. Get Your Supabase Anon Key

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project (ID: glgmoelyqnbyavabjgyw)
3. Go to Settings > API
4. Copy the "anon public" key
5. Replace `your_actual_supabase_anon_key_here` with the actual key

### 3. Restart the Development Server

After creating the `.env.local` file:

```bash
npm run dev
```

### 4. Verify the Fix

The application should now connect to Supabase successfully and the "backend offline" error should be resolved.

## Alternative: Use Local Supabase

If you prefer to run Supabase locally:

1. Install Supabase CLI: `npm install -g supabase`
2. Start local Supabase: `supabase start`
3. Use the local URLs provided by the CLI

## Troubleshooting

- Make sure the `.env.local` file is in the project root directory
- Ensure there are no extra spaces or quotes around the environment variable values
- Check the browser console for any additional error messages
- Verify your Supabase project is active and accessible
