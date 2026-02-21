// Legacy compatibility layer.
// Canonical RandomGenerator now lives under features/tournament/components.

import { RandomGenerator as TournamentRandomGenerator } from "@/features/tournament/components/RandomGenerator";
import { coreAPI } from "@/services/supabase/client";

interface RandomGeneratorProps {
	userName: string;
}

export function RandomGenerator({ userName: _userName }: RandomGeneratorProps) {
	return <TournamentRandomGenerator fetchNames={() => coreAPI.getTrendingNames(false)} />;
}
