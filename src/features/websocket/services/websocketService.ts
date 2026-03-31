/**
 * @module websocketService
 * @description Real-time service backed by Supabase Realtime channels.
 * Replaces the legacy WebSocket server integration.
 */

import { resolveSupabaseClient } from "@/shared/services/supabase/runtime";

export interface TournamentUpdate {
	tournamentId: string;
	round: number;
	matchNumber: number;
	currentMatch: {
		leftId: string | null;
		rightId: string | null;
	};
	status: "in_progress" | "completed";
}

export interface MatchResult {
	tournamentId: string;
	matchId: string;
	winnerId: string;
	loserId: string;
	newRatings: Record<string, number>;
}

export interface UserActivity {
	userId: string;
	action: "joined" | "left";
	timestamp: number;
}

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

class RealtimeService {
	private channel: ReturnType<any["channel"]> | null = null;
	private connectionState: ConnectionState = "disconnected";
	private nameChangeCallbacks: Array<(payload: unknown) => void> = [];
	private ratingChangeCallbacks: Array<(payload: unknown) => void> = [];

	async connect(): Promise<void> {
		if (this.connectionState === "connected" || this.connectionState === "connecting") {
			return;
		}

		this.connectionState = "connecting";

		try {
			const client = (await resolveSupabaseClient()) as any;
			if (!client) {
				this.connectionState = "disconnected";
				return;
			}

			this.channel = client
				.channel("db-changes")
				.on(
					"postgres_changes",
					{ event: "*", schema: "public", table: "cat_names" },
					(payload: unknown) => {
						for (const cb of this.nameChangeCallbacks) cb(payload);
					},
				)
				.on(
					"postgres_changes",
					{ event: "INSERT", schema: "public", table: "user_cat_name_ratings" },
					(payload: unknown) => {
						for (const cb of this.ratingChangeCallbacks) cb(payload);
					},
				)
				.subscribe((status: string) => {
					if (status === "SUBSCRIBED") {
						this.connectionState = "connected";
					} else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
						this.connectionState = "disconnected";
					}
				});
		} catch (error) {
			console.warn("[RealtimeService] Failed to connect:", error);
			this.connectionState = "error";
		}
	}

	disconnect(): void {
		if (this.channel) {
			this.channel.unsubscribe();
			this.channel = null;
		}
		this.connectionState = "disconnected";
	}

	getConnectionState(): ConnectionState {
		return this.connectionState;
	}

	isConnected(): boolean {
		return this.connectionState === "connected";
	}

	onNameChange(callback: (payload: unknown) => void): () => void {
		this.nameChangeCallbacks.push(callback);
		return () => {
			this.nameChangeCallbacks = this.nameChangeCallbacks.filter((cb) => cb !== callback);
		};
	}

	onRatingChange(callback: (payload: unknown) => void): () => void {
		this.ratingChangeCallbacks.push(callback);
		return () => {
			this.ratingChangeCallbacks = this.ratingChangeCallbacks.filter((cb) => cb !== callback);
		};
	}

	subscribeToTournament(
		_tournamentId: string,
		_callback: (update: TournamentUpdate) => void,
	): () => void {
		return () => {};
	}

	subscribeToMatches(_callback: (result: MatchResult) => void): () => void {
		return () => {};
	}

	subscribeToUserActivity(_callback: (activity: UserActivity) => void): () => void {
		return () => {};
	}

	sendMessage(_message: unknown): void {}

	onMessage(_type: string, _handler: (message: unknown) => void): void {}

	offMessage(_type: string): void {}

	cleanup(): void {
		this.disconnect();
	}
}

let serviceInstance: RealtimeService | null = null;

export function getWebSocketService(_url?: string): RealtimeService {
	if (!serviceInstance) {
		serviceInstance = new RealtimeService();
	}
	return serviceInstance;
}
