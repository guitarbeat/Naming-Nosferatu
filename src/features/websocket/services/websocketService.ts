/**
 * @module websocketService
 * @description Real-time service backed by Supabase Realtime channels.
 * Replaces the legacy WebSocket server integration.
 */

import type { RealtimeChannel } from "@supabase/supabase-js";
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
type MessageHandler = (message: { data: unknown }) => void;

class RealtimeService {
        private dbChannel: RealtimeChannel | null = null;
        private appChannel: RealtimeChannel | null = null;
        private tournamentChannels = new Map<string, RealtimeChannel>();
        private pendingTournamentChannels = new Map<string, Promise<void>>();
        private connectionState: ConnectionState = "disconnected";
        private nameChangeCallbacks: Array<(payload: unknown) => void> = [];
        private ratingChangeCallbacks: Array<(payload: unknown) => void> = [];
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
                                        { event: "*", schema: "public", table: "cat_names" },
                                        (payload) => {
                                                for (const cb of this.nameChangeCallbacks) cb(payload);
                                        },
                                )
                                .on(
                                        "postgres_changes",
                                        { event: "INSERT", schema: "public", table: "user_cat_name_ratings" },
                                        (payload) => {
                                                for (const cb of this.ratingChangeCallbacks) cb(payload);
                                        },
                                )
                                .subscribe((status) => {
                                        if (status === "SUBSCRIBED") {
                                                this.connectionState = "connected";
                                        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
                                                this.connectionState = "disconnected";
                                        }
                                });

                        this.appChannel = client
                                .channel("app-broadcast")
                                .on("broadcast", { event: "*" }, (payload) => {
                                        const type = payload.event as string;
                                        const handlers = this.messageHandlers.get(type);
                                        if (handlers) {
                                                for (const handler of handlers) {
                                                        handler({ data: payload.payload });
                                                }
                                        }
                                })
                                .subscribe();
                } catch (error) {
                        console.warn("[RealtimeService] Failed to connect:", error);
                        this.connectionState = "error";
                }
        }

        disconnect(): void {
                this.dbChannel?.unsubscribe();
                this.dbChannel = null;
                this.appChannel?.unsubscribe();
                this.appChannel = null;
                for (const ch of this.tournamentChannels.values()) {
                        ch.unsubscribe();
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
                let cancelled = false;

                const existingChannel = this.tournamentChannels.get(tournamentId);
                if (!existingChannel && !this.pendingTournamentChannels.has(tournamentId)) {
                        const pending = resolveSupabaseClient().then((client) => {
                                if (!client || cancelled) return;
                                if (this.tournamentChannels.has(tournamentId)) return;
                                const channel = client
                                        .channel(`tournament:${tournamentId}`)
                                        .on("broadcast", { event: "tournament_update" }, (payload) => {
                                                const update = payload.payload as TournamentUpdate;
                                                if (update?.tournamentId) callback(update);
                                        })
                                        .subscribe();
                                if (!cancelled) {
                                        this.tournamentChannels.set(tournamentId, channel as RealtimeChannel);
                                }
                        }).finally(() => {
                                this.pendingTournamentChannels.delete(tournamentId);
                        });
                        this.pendingTournamentChannels.set(tournamentId, pending);
                }

                return () => {
                        cancelled = true;
                        const ch = this.tournamentChannels.get(tournamentId);
                        if (ch) {
                                ch.unsubscribe();
                                this.tournamentChannels.delete(tournamentId);
                        }
                };
        }

        subscribeToMatches(callback: (result: MatchResult) => void): () => void {
                const handler = (payload: unknown) => {
                        const record = (payload as { new?: Record<string, unknown> }).new;
                        if (!record) return;
                        const result: MatchResult = {
                                tournamentId: String(record.user_name ?? ""),
                                matchId: String(record.name_id ?? ""),
                                winnerId: String(record.name_id ?? ""),
                                loserId: "",
                                newRatings: { [String(record.name_id ?? "")]: Number(record.rating ?? 1500) },
                        };
                        callback(result);
                };
                this.ratingChangeCallbacks.push(handler);
                return () => {
                        this.ratingChangeCallbacks = this.ratingChangeCallbacks.filter((cb) => cb !== handler);
                };
        }

        subscribeToUserActivity(callback: (activity: UserActivity) => void): () => void {
                let presenceChannel: RealtimeChannel | null = null;
                let cancelled = false;

                resolveSupabaseClient().then((client) => {
                        if (!client || cancelled) return;
                        presenceChannel = client
                                .channel("user-presence")
                                .on("presence", { event: "join" }, ({ newPresences }) => {
                                        for (const presence of newPresences) {
                                                callback({
                                                        userId: String((presence as Record<string, unknown>).user_id ?? presence.presence_ref),
                                                        action: "joined",
                                                        timestamp: Date.now(),
                                                });
                                        }
                                })
                                .on("presence", { event: "leave" }, ({ leftPresences }) => {
                                        for (const presence of leftPresences) {
                                                callback({
                                                        userId: String((presence as Record<string, unknown>).user_id ?? presence.presence_ref),
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

let serviceInstance: RealtimeService | null = null;

export function getWebSocketService(_url?: string): RealtimeService {
        if (!serviceInstance) {
                serviceInstance = new RealtimeService();
        }
        return serviceInstance;
}
