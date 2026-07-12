import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef } from "react";
import { resolveSupabaseClient } from "@/shared/services/supabase/runtime";
import { IS_DEV } from "@/store/appStore.shared";

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

class TournamentRealtimeService {
	private dbChannel: RealtimeChannel | null = null;
	private tournamentChannels = new Map<string, RealtimeChannel>();
	private connectionState: ConnectionState = "disconnected";
	private nameChangeCallbacks = new Set<(payload: unknown) => void>();
	private ratingChangeCallbacks = new Set<(payload: unknown) => void>();
	private messageHandlers = new Map<string, Set<MessageHandler>>();

	async connect(): Promise<void> {
		if (this.connectionState === "connected" || this.connectionState === "connecting") {
			return;
		}
		this.connectionState = "connecting";

		try {
			const client = await resolveSupabaseClient();
			if (!client) {
				this.connectionState = "disconnected";
				return;
			}

			this.dbChannel = client
				.channel("db-changes")
				.on(
					"postgres_changes",
					{ event: "INSERT", schema: "public", table: "user_cat_name_ratings" },
					(payload) => {
						for (const callback of this.ratingChangeCallbacks) {
							callback(payload);
						}
					},
				)
				.subscribe((status) => {
					if (status === "SUBSCRIBED") {
						this.connectionState = "connected";
					} else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
						this.connectionState = "disconnected";
					}
				});
		} catch (error) {
			if (IS_DEV) {
				console.warn("[TournamentRealtimeService] Failed to connect:", error);
			}
			this.connectionState = "error";
		}
	}

	disconnect(): void {
		this.dbChannel?.unsubscribe();
		this.dbChannel = null;
		for (const channel of this.tournamentChannels.values()) {
			channel.unsubscribe();
		}
		this.tournamentChannels.clear();
		this.connectionState = "disconnected";
	}

	getConnectionState(): ConnectionState {
		return this.connectionState;
	}

	isConnected(): boolean {
		return this.connectionState === "connected";
	}

	onNameChange(callback: (payload: unknown) => void): () => void {
		this.nameChangeCallbacks.add(callback);
		return () => {
			this.nameChangeCallbacks.delete(callback);
		};
	}

	onRatingChange(callback: (payload: unknown) => void): () => void {
		this.ratingChangeCallbacks.add(callback);
		return () => {
			this.ratingChangeCallbacks.delete(callback);
		};
	}

	onMessage(type: string, handler: MessageHandler): void {
		if (!this.messageHandlers.has(type)) {
			this.messageHandlers.set(type, new Set());
		}
		this.messageHandlers.get(type)?.add(handler);
	}

	offMessage(type: string): void {
		this.messageHandlers.delete(type);
	}

	sendMessage(message: unknown): void {
		this.appChannel?.send({
			type: "broadcast",
			event: "message",
			payload: message,
		});
	}

	subscribeToTournament(
		tournamentId: string,
		callback: (update: TournamentUpdate) => void,
	): () => void {
		let channel = this.tournamentChannels.get(tournamentId);
		let cancelled = false;

		if (!channel) {
			resolveSupabaseClient().then((client) => {
				if (!client || cancelled) {
					return;
				}

				channel = client
					.channel(`tournament:${tournamentId}`)
					.on("broadcast", { event: "tournament_update" }, (payload) => {
						const update = payload.payload as TournamentUpdate;
						if (update?.tournamentId) {
							callback(update);
						}
					})
					.subscribe();

				if (!cancelled) {
					this.tournamentChannels.set(tournamentId, channel as RealtimeChannel);
				}
			});
		}

		return () => {
			cancelled = true;
			const activeChannel = this.tournamentChannels.get(tournamentId);
			if (activeChannel) {
				activeChannel.unsubscribe();
				this.tournamentChannels.delete(tournamentId);
			}
		};
	}

	subscribeToMatches(callback: (result: MatchResult) => void): () => void {
		const handler = (payload: unknown) => {
			const record = (payload as { new?: Record<string, unknown> }).new;
			if (!record) {
				return;
			}

			const result: MatchResult = {
				tournamentId: String(record.user_name ?? ""),
				matchId: String(record.name_id ?? ""),
				winnerId: String(record.name_id ?? ""),
				loserId: "",
				newRatings: {
					[String(record.name_id ?? "")]: Number(record.rating ?? 1500),
				},
			};
			callback(result);
		};
		this.ratingChangeCallbacks.add(handler);
		return () => {
			this.ratingChangeCallbacks.delete(handler);
		};
	}

	subscribeToUserActivity(callback: (activity: UserActivity) => void): () => void {
		let presenceChannel: RealtimeChannel | null = null;
		let cancelled = false;

		resolveSupabaseClient().then((client) => {
			if (!client || cancelled) {
				return;
			}

			presenceChannel = client
				.channel("user-presence")
				.on("presence", { event: "join" }, ({ newPresences }) => {
					for (const presence of newPresences) {
						callback({
							userId: String(
								(presence as Record<string, unknown>).user_id ?? presence.presence_ref,
							),
							action: "joined",
							timestamp: Date.now(),
						});
					}
				})
				.on("presence", { event: "leave" }, ({ leftPresences }) => {
					for (const presence of leftPresences) {
						callback({
							userId: String(
								(presence as Record<string, unknown>).user_id ?? presence.presence_ref,
							),
							action: "left",
							timestamp: Date.now(),
						});
					}
				})
				.subscribe();
		});

		return () => {
			cancelled = true;
			presenceChannel?.unsubscribe();
			presenceChannel = null;
		};
	}

	cleanup(): void {
		this.disconnect();
	}
}

let serviceInstance: TournamentRealtimeService | null = null;

function getTournamentRealtimeService(): TournamentRealtimeService {
	if (!serviceInstance) {
		serviceInstance = new TournamentRealtimeService();
	}
	return serviceInstance;
}

interface UseTournamentRealtimeOptions {
	autoConnect?: boolean;
}

export function useTournamentRealtime(options: UseTournamentRealtimeOptions = {}) {
	const serviceRef = useRef<TournamentRealtimeService | null>(null);

	useEffect(() => {
		if (!serviceRef.current) {
			serviceRef.current = getTournamentRealtimeService();

			if (options.autoConnect) {
				serviceRef.current.connect().catch((error) => {
					if (IS_DEV) {
						console.error("[TournamentRealtimeService] Connect error:", error);
					} else {
						// Error handled silently in production
					}
				});
			}
		}

		return () => {
			serviceRef.current?.disconnect();
			serviceRef.current = null;
		};
	}, [options.autoConnect]);

	const subscribeToTournament = useCallback(
		(tournamentId: string, callback: (update: TournamentUpdate) => void) => {
			return serviceRef.current?.subscribeToTournament(tournamentId, callback);
		},
		[],
	);

	const subscribeToMatches = useCallback((callback: (result: MatchResult) => void) => {
		return serviceRef.current?.subscribeToMatches(callback);
	}, []);

	const subscribeToUserActivity = useCallback((callback: (activity: UserActivity) => void) => {
		return serviceRef.current?.subscribeToUserActivity(callback);
	}, []);

	const cleanup = useCallback(() => {
		serviceRef.current?.cleanup();
	}, []);

	return {
		subscribeToTournament,
		subscribeToMatches,
		subscribeToUserActivity,
		cleanup,
	};
}
