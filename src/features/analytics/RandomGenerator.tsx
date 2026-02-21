// Legacy compatibility layer.
// Canonical RandomGenerator now lives under features/tournament/components.
import { coreAPI } from "@/services/supabase/client";
import { RandomGenerator as TournamentRandomGenerator } from "@/features/tournament/components/RandomGenerator";

interface RandomGeneratorProps {
	userName: string;
}

export function RandomGenerator({ userName: _userName }: RandomGeneratorProps) {
	return <TournamentRandomGenerator fetchNames={() => coreAPI.getTrendingNames(false)} />;
}
