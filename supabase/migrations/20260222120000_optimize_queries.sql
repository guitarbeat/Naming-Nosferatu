-- Add index for ranking history query optimization
-- This optimizes queries filtering by selected_at in /api/analytics/ranking-history
CREATE INDEX IF NOT EXISTS idx_cat_tournament_selections_selected_at
ON cat_tournament_selections(selected_at);

-- Add partial index for optimized name listing
-- This optimizes the default query in /api/names which filters by is_active=true AND is_hidden=false
-- and sorts by avg_rating DESC
CREATE INDEX IF NOT EXISTS idx_cat_name_options_rating_active_visible
ON cat_name_options(avg_rating DESC)
WHERE is_active = true AND is_hidden = false;
