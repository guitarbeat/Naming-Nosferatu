import type { Config, User } from "./types";

export function helper() {
	return 42;
}

// ============================================================================
// Integrated from reference file
// ============================================================================

export function getUser(): User {
	return { name: "test" };
}

// ============================================================================
// Integrated from reference file
// ============================================================================

export function useConfig(c: Config) {
	return c.value;
}
