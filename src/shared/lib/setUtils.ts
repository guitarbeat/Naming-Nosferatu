export function addToSet<T>(source: ReadonlySet<T>, value: T): Set<T> {
	const next = new Set(source);
	next.add(value);
	return next;
}

export function addManyToSet<T>(source: ReadonlySet<T>, values: Iterable<T>): Set<T> {
	const next = new Set(source);
	for (const value of values) {
		next.add(value);
	}
	return next;
}

export function removeFromSet<T>(source: ReadonlySet<T>, value: T): Set<T> {
	const next = new Set(source);
	next.delete(value);
	return next;
}

export function toggleInSet<T>(source: ReadonlySet<T>, value: T): Set<T> {
	if (source.has(value)) {
		return removeFromSet(source, value);
	}
	return addToSet(source, value);
}
