import type { Match, NameItem } from "@/shared/types";

export interface NormalizedParticipant {
	id: string;
	name: string;
	memberIds: string[];
	memberNames: string[];
	isTeam: boolean;
	description?: string;
	pronunciation?: string;
}

export function normalizeParticipant(
	participant: Match["left"] | Match["right"],
): NormalizedParticipant {
	if (typeof participant === "object") {
		if ("memberNames" in participant) {
			return {
				id: String(participant.id),
				name:
					(participant.memberNames ?? []).join(" + ") || String(participant.id),
				memberIds: participant.memberIds?.map(String) ?? [
					String(participant.id),
				],
				memberNames: participant.memberNames ?? [],
				isTeam: true,
			};
		}
		return {
			id: String(participant.id),
			name: participant.name,
			memberIds: [String(participant.id)],
			memberNames: [participant.name],
			isTeam: false,
			description: participant.description,
			pronunciation: (participant as NameItem).pronunciation,
		};
	}
	return {
		id: String(participant),
		name: String(participant),
		memberIds: [String(participant)],
		memberNames: [String(participant)],
		isTeam: false,
	};
}

export function getMatchSideId(match: Match, side: "left" | "right"): string {
	return normalizeParticipant(match[side]).id;
}

export function getMatchSideName(match: Match, side: "left" | "right"): string {
	return normalizeParticipant(match[side]).name;
}

export interface MatchSideData {
	leftId: string;
	rightId: string;
	leftName: string;
	rightName: string;
	leftMembers: string[];
	rightMembers: string[];
	leftIsTeam: boolean;
	rightIsTeam: boolean;
	leftDescription?: string;
	rightDescription?: string;
	leftPronunciation?: string;
	rightPronunciation?: string;
}

export function extractMatchData(match: Match): MatchSideData {
	const left = normalizeParticipant(match.left);
	const right = normalizeParticipant(match.right);

	return {
		leftId: left.id,
		rightId: right.id,
		leftName: left.name,
		rightName: right.name,
		leftMembers: left.memberNames,
		rightMembers: right.memberNames,
		leftIsTeam: left.isTeam,
		rightIsTeam: right.isTeam,
		leftDescription: left.description,
		rightDescription: right.description,
		leftPronunciation: left.pronunciation,
		rightPronunciation: right.pronunciation,
	};
}
