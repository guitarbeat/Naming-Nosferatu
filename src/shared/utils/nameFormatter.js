/**
 * @module nameFormatter
 * @description Utilities for formatting and validating cat names
 */

/**
 * Formats a name object into a display string
 * @param {Object} nameObj - Name object with first_name, middle_names, last_name
 * @returns {string} Formatted full name
 */
export const formatFullName = (nameObj) => {
  if (!nameObj) return '';
  
  const parts = [
    nameObj.first_name,
    ...(Array.isArray(nameObj.middle_names) ? nameObj.middle_names : []),
    nameObj.last_name
  ].filter(Boolean).map(part => part.trim()).filter(part => part);
  
  return parts.join(' ');
};

/**
 * Validates name data structure
 * @param {Object} nameData - Name object to validate
 * @returns {Object} { valid: boolean, error: string|null }
 */
export const validateNameData = (nameData) => {
  if (!nameData) {
    return { valid: false, error: 'Name data is required' };
  }
  
  if (!nameData.first_name || nameData.first_name.trim() === '') {
    return { valid: false, error: 'First name is required' };
  }
  
  if (nameData.first_name.length > 50) {
    return { valid: false, error: 'First name must be less than 50 characters' };
  }
  
  if (nameData.last_name && nameData.last_name.length > 50) {
    return { valid: false, error: 'Last name must be less than 50 characters' };
  }
  
  return { valid: true, error: null };
};

/**
 * Formats middle names array for display
 * @param {Array|string} middleNames - Array of middle names or comma-separated string
 * @returns {string} Formatted middle names
 */
export const formatMiddleNames = (middleNames) => {
  if (!middleNames) return '';
  
  if (typeof middleNames === 'string') {
    return middleNames.split(',').map(n => n.trim()).filter(n => n).join(', ');
  }
  
  if (Array.isArray(middleNames)) {
    return middleNames.filter(Boolean).join(', ');
  }
  
  return '';
};
