import type { NameItem } from "@/shared/types";

export type NameWithStats = NameItem & {
	votes?: number;
	popularityScore?: number;
};

export type BulkAction = "hide" | "unhide" | "lock" | "unlock";
