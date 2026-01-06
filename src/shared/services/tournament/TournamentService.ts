import { supabase } from "../supabase/client";

export interface Tournament {
	id: string;
	name: string;
	names: string[];
	ratings: Record<string, number>;
	isComplete: boolean;
	createdAt: string;
	userId: string;
}

export interface CreateTournamentData {
	name: string;
	names: string[];
}

export class TournamentService {
	async createTournament(
		data: CreateTournamentData,
		userId: string,
	): Promise<Tournament> {
		const tournament: Tournament = {
			id: crypto.randomUUID(),
			name: data.name,
			names: data.names,
			ratings: {},
			isComplete: false,
			createdAt: new Date().toISOString(),
			userId,
		};

		// Initialize ratings
		data.names.forEach((name) => {
			tournament.ratings[name] = 1200; // Default ELO rating
		});

		// Save to database (simplified)
		const { error } = await supabase.from("tournaments").insert([tournament]);

		if (error) throw error;
		return tournament;
	}

	async getTournaments(userId: string): Promise<Tournament[]> {
		const { data, error } = await supabase
			.from("tournaments")
			.select("*")
			.eq("userId", userId)
			.order("createdAt", { ascending: false });

		if (error) throw error;
		return data || [];
	}

	async updateTournament(
		id: string,
		updates: Partial<Tournament>,
	): Promise<Tournament> {
		const { data, error } = await supabase
			.from("tournaments")
			.update(updates)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	async deleteTournament(id: string): Promise<void> {
		const { error } = await supabase.from("tournaments").delete().eq("id", id);

		if (error) throw error;
	}

	calculateEloRating(
		winnerRating: number,
		loserRating: number,
		kFactor = 32,
	): [number, number] {
		const expectedWinner = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
		const expectedLoser = 1 / (1 + 10 ** ((winnerRating - loserRating) / 400));

		const newWinnerRating = Math.round(
			winnerRating + kFactor * (1 - expectedWinner),
		);
		const newLoserRating = Math.round(
			loserRating + kFactor * (0 - expectedLoser),
		);

		return [newWinnerRating, newLoserRating];
	}
}
