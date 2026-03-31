-- Migration: Allow NULL user_id in user_cat_name_ratings
-- Tournament participation is identified by user_name (not auth.uid).
-- Both apply_tournament_match_elo and save_user_ratings insert rows by
-- user_name only; user_id is optionally linked later via link_auth_uid().
-- Making it nullable aligns the schema with the actual insert pattern.

ALTER TABLE public.user_cat_name_ratings
  ALTER COLUMN user_id DROP NOT NULL;
