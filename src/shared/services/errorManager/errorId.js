/**
 * @module errorManager/errorId
 * @description Error ID generation utilities.
 */

import { getGlobalScope } from './helpers';

/**
 * * Generates unique error ID
 * @returns {string} Unique error identifier
 */
export function generateErrorId() {
  const GLOBAL_SCOPE = getGlobalScope();
  
  if (GLOBAL_SCOPE.crypto?.randomUUID) {
    return `error_${GLOBAL_SCOPE.crypto.randomUUID()}`;
  }

  const randomSegment = Math.random().toString(36).slice(2, 11);
  return `error_${Date.now()}_${randomSegment}`;
}

