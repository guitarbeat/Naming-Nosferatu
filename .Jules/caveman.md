<strict_log>
- Momentum: Extracted TournamentHeader and its subcomponents to `components/ui/TournamentHeader.tsx`.
- Smash: Ripped TournamentAnnouncements and StreakBurst out of TournamentArena.tsx.
- Clean: Dropped them in `components/ui/TournamentAnnouncements.tsx`. Cleaned up imports, formatting and unused types.
- Memory Update: Arena announcements are now in components/ui, making TournamentArena smaller (from 1275 down to 1030 lines).
</strict_log>
