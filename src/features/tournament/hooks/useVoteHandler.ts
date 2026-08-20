import { useCallback } from "react";
import type { MatchNode } from "@/shared/types";
import { normalizeParticipant } from "../utils/matchHelpers";

interface UseVoteHandlerProps {
	onVote?: (data: {
		match: {
			left: { name: string; id: string; description: string; outcome: string };
			right: { name: string; id: string; description: string; outcome: string };
		};
		result: number;
		ratings: Record<string, number>;
		timestamp: string;
	}) => Promise<void> | void;
	currentMatch: MatchNode | null;
	ratings: Record<string, number>;
}

export function useVoteHandler({
	onVote,
	currentMatch,
	ratings,
}: UseVoteHandlerProps) {
	return useCallback(
		async (winnerId: string, _loserId: string) => {
			if (!onVote || !currentMatch) {
				return;
			}
			const left = normalizeParticipant(currentMatch.left);
			const right = normalizeParticipant(currentMatch.right);
			const leftData = {
				name: left.name,
				id: left.id,
				description: left.description ?? "",
				outcome: winnerId === left.id ? "winner" : "loser",
			};
			const rightData = {
				name: right.name,
				id: right.id,
				description: right.description ?? "",
				outcome: winnerId === right.id ? "winner" : "loser",
			};
			try {
				await Promise.resolve(
					onVote({
						match: { left: leftData, right: rightData },
						result: winnerId === left.id ? 1 : 0,
						ratings,
						timestamp: new Date().toISOString(),
					}),
				);
			} catch (error) {
				console.warn("Tournament vote callback did not persist:", error);
			}
		},
		[onVote, currentMatch, ratings],
	);
}
