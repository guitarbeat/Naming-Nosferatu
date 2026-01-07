/**
 * TournamentService - Handles tournament-related data fetching
 * Uses the consolidated cat-names API from shared services
 */

import { catNamesAPI } from "../../../shared/services/supabase/modules/cat-names-consolidated";

export interface CatName {
	id: string;
	name: string;
	description?: string;
	avg_rating?: number;
	is_active: boolean;
	is_hidden?: boolean;
	created_at?: string;
}

interface Result<T, E = { message: string }> {
	isOk(): this is OkResult<T>;
	isErr(): this is ErrResult<E>;
	value?: T;
	error?: E;
}

interface OkResult<T> extends Result<T> {
	value: T;
}

interface ErrResult<E> extends Result<unknown, E> {
	error: E;
}

function ok<T>(value: T): OkResult<T> {
	return {
		isOk(): this is OkResult<T> {
			return true;
		},
		isErr(): this is ErrResult<{ message: string }> {
			return false;
		},
		value,
	};
}

function err<E = { message: string }>(error: E): ErrResult<E> {
	return {
		isOk(): this is OkResult<unknown> {
			return false;
		},
		isErr(): this is ErrResult<E> {
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
			if (result.success) {
				return ok(result.data);
			}
			return err({ message: result.error || "Failed to add name" });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to add name";
			return err({ message });
		}
	},
};

export type { Result };
