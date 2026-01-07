/**
 * TournamentService - Handles tournament-related data fetching
 * Uses the consolidated cat-names API from shared services
 */

import { catNamesAPI } from "../../../shared/services/supabase/modules/cat-names-consolidated";

export interface CatName {
	id: string;
	name: string;
	description?: string;
	// biome-ignore lint/style/useNamingConvention: Database field must match Supabase schema
	avg_rating?: number;
	// biome-ignore lint/style/useNamingConvention: Database field must match Supabase schema
	is_active: boolean;
	// biome-ignore lint/style/useNamingConvention: Database field must match Supabase schema
	is_hidden?: boolean;
	// biome-ignore lint/style/useNamingConvention: Database field must match Supabase schema
	created_at?: string;
}

interface Result<T, E = { message: string }> {
	isOk(): this is OkResult<T>;
	isErr(): this is ErrResult<T, E>;
	value?: T;
	error?: E;
}

interface OkResult<T> extends Result<T> {
	value: T;
}

interface ErrResult<T, E> extends Result<T, E> {
	error: E;
}

function ok<T>(value: T): OkResult<T> {
	return {
		isOk(): this is OkResult<T> {
			return true;
		},
		isErr(): this is ErrResult<T, { message: string }> {
			return false;
		},
		value,
	};
}

function err<T, E = { message: string }>(error: E): ErrResult<T, E> {
	return {
		isOk(): this is OkResult<T> {
			return false;
		},
		isErr(): this is ErrResult<T, E> {
			return true;
		},
		error,
	};
}

export const TournamentService = {
	/**
	 * Fetch all active (non-hidden) cat names for tournament selection
	 */
	async fetchActiveNames(): Promise<Result<CatName[]>> {
		try {
			const names = await catNamesAPI.getNamesWithDescriptions(false);
			return ok(names as CatName[]);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to fetch names";
			return err({ message });
		}
	},

	/**
	 * Fetch all names including hidden ones (for admin views)
	 */
	async fetchAllNames(): Promise<Result<CatName[]>> {
		try {
			const names = await catNamesAPI.getNamesWithDescriptions(true);
			return ok(names as CatName[]);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to fetch names";
			return err({ message });
		}
	},

	/**
	 * Add a new cat name
	 */
	async addName(
		name: string,
		description: string = "",
		userName: string | null = null,
	): Promise<Result<CatName>> {
		try {
			const result = await catNamesAPI.addName(name, description, userName);
			if (result.success && result.data) {
				// Transform the API response to match CatName interface
				const catName: CatName = {
					id: result.data.id,
					name: result.data.name,
					description: result.data.description || undefined,
					avg_rating: result.data.avg_rating || undefined,
					is_active: result.data.is_active || false,
					is_hidden: false, // Default for new names
					created_at: result.data.created_at,
				};
				return ok(catName);
			}
			return err({ message: result.error || "Failed to add name" });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to add name";
			return err({ message });
		}
	},
};

export type { Result };
