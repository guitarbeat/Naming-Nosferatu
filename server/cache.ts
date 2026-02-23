// Simple in-memory cache implementation
// This avoids adding heavy external dependencies like Redis for simple use cases.

type CacheEntry<T> = {
	value: T;
	expiry: number;
};

export class SimpleCache {
	// biome-ignore lint/suspicious/noExplicitAny: Cache can store any type of data
	private cache = new Map<string, CacheEntry<any>>();
	private defaultTtl: number;

	/**
	 * @param defaultTtl Time to live in milliseconds (default: 60 seconds)
	 */
	constructor(defaultTtl = 60 * 1000) {
		this.defaultTtl = defaultTtl;
	}

	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) {
			return null;
		}

		if (Date.now() > entry.expiry) {
			this.cache.delete(key);
			return null;
		}

		return entry.value as T;
	}

	set<T>(key: string, value: T, ttl: number = this.defaultTtl): void {
		this.cache.set(key, {
			value,
			expiry: Date.now() + ttl,
		});
	}

	clear(): void {
		this.cache.clear();
	}

	// Optional: periodic cleanup if memory usage becomes a concern
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expiry) {
				this.cache.delete(key);
			}
		}
	}
}
