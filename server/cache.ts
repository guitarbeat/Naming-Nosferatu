export class SimpleCache<T> {
	private cache = new Map<string, { value: T; expires: number }>();
	private ttl: number;
	private maxSize: number;

	constructor(ttlSeconds: number, maxSize = 100) {
		this.ttl = ttlSeconds * 1000;
		this.maxSize = maxSize;
	}

	get(key: string): T | undefined {
		const item = this.cache.get(key);
		if (!item) {
			return undefined;
		}

		if (Date.now() > item.expires) {
			this.cache.delete(key);
			return undefined;
		}

		return item.value;
	}

	set(key: string, value: T): void {
		if (this.cache.size >= this.maxSize) {
			const oldestKey = this.cache.keys().next().value;
			if (oldestKey) {
				this.cache.delete(oldestKey);
			}
		}
		this.cache.set(key, {
			value,
			expires: Date.now() + this.ttl,
		});
	}

	clear(): void {
		this.cache.clear();
	}
}
