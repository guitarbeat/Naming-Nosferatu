/**
 * @module classname
 * @description Classname combining utilities
 */

import { cx } from "class-variance-authority";
import type { ClassValue } from "class-variance-authority/types";

/**
 * Combines class names using class-variance-authority
 */
export function cn(...inputs: ClassValue[]): string {
	return cx(inputs);
}
