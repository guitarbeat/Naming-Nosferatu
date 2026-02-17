-- Migration: Optimize queries for ranking history and active/visible name listing
-- Reason: Improve performance of frequently executed queries

-- 1. Index on cat_tournament_selections(selected_at)
-- Used by: /api/analytics/ranking-history
CREATE INDEX IF NOT EXISTS idx_cat_tournament_selections_selected_at ON cat_tournament_selections(selected_at);

-- 2. Index on cat_name_options(avg_rating DESC) filtered by active/visible
-- Used by: /api/names (default sort), /api/analytics/leaderboard, and others
CREATE INDEX IF NOT EXISTS idx_cat_name_options_avg_rating_active_visible ON cat_name_options(avg_rating DESC) WHERE is_active = true AND is_hidden = false;
