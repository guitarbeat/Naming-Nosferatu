import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx logic.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 */
export function shuffleArray<T>(array: T[]): T[] {
	const next = [...array];
	for (let i = next.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = next[i] as T;
		next[i] = next[j] as T;
		next[j] = temp;
	}
	return next;
}
