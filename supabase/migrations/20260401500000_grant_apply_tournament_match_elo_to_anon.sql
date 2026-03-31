-- Migration: Grant apply_tournament_match_elo to anon role
-- Tournament participants play anonymously (no Supabase auth session).
-- Per-match ELO updates must be callable from anon callers so that each
-- vote drives global win/loss counters in real time.
-- The function is SECURITY DEFINER and validates inputs, so granting
-- to anon is safe for this use case.
GRANT EXECUTE ON FUNCTION public.apply_tournament_match_elo(TEXT, UUID[], UUID[], TEXT) TO anon;
