-- Migration: Add covering index to cat_tournament_selections
-- Reason: Optimize aggregation queries for top selections by allowing Index Only Scan

DROP INDEX IF EXISTS idx_cat_tournament_selections_name_id;
CREATE INDEX IF NOT EXISTS idx_cat_tournament_selections_covering ON cat_tournament_selections(name_id, name);
