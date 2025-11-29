/**
 * @module propTypes
 * @description Shared PropTypes definitions for common data shapes.
 * Centralizes PropTypes to ensure consistency and reduce duplication.
 */

import PropTypes from "prop-types";

/**
 * Common ID type - can be string or number
 */
export const idType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

/**
 * Name item shape - used in rankings, highlights, charts
 */
export const nameItemShape = PropTypes.shape({
  id: idType,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});

/**
 * Name with rating shape - used in tournament results
 */
export const nameWithRatingShape = PropTypes.shape({
  id: idType.isRequired,
  name: PropTypes.string.isRequired,
  rating: PropTypes.number,
  wins: PropTypes.number,
  losses: PropTypes.number,
});

/**
 * Tournament match participant shape
 */
export const matchParticipantShape = PropTypes.shape({
  name: PropTypes.string,
  description: PropTypes.string,
  id: idType,
});

/**
 * Tournament match shape
 */
export const matchShape = PropTypes.shape({
  left: matchParticipantShape,
  right: matchParticipantShape,
});

/**
 * Select option shape
 */
export const selectOptionShape = PropTypes.shape({
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
});

/**
 * Stats item shape - used in analytics
 */
export const statsItemShape = PropTypes.shape({
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  accent: PropTypes.bool,
});

/**
 * Toast shape
 */
export const toastShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error", "info", "warning"]),
  duration: PropTypes.number,
});

/**
 * User shape
 */
export const userShape = PropTypes.shape({
  isLoggedIn: PropTypes.bool.isRequired,
  name: PropTypes.string,
  isAdmin: PropTypes.bool,
});

/**
 * Filter shape for tournament/profile
 */
export const filtersShape = PropTypes.shape({
  searchTerm: PropTypes.string,
  category: PropTypes.string,
  sortBy: PropTypes.string,
  sortOrder: PropTypes.oneOf(["asc", "desc"]),
  status: PropTypes.string,
  userFilter: PropTypes.string,
});

/**
 * Highlight group shape
 */
export const highlightGroupShape = PropTypes.shape({
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(nameItemShape),
});

/**
 * Drag offset shape
 */
export const dragOffsetShape = PropTypes.shape({
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
});

/**
 * Volume settings shape
 */
export const volumeShape = PropTypes.shape({
  music: PropTypes.number,
  effects: PropTypes.number,
});

/**
 * Grade shape for performance metrics
 */
export const gradeShape = PropTypes.shape({
  grade: PropTypes.string,
  color: PropTypes.string,
});

/**
 * Cat name shape
 */
export const catNameShape = PropTypes.shape({
  first_name: PropTypes.string,
  middle_names: PropTypes.arrayOf(PropTypes.string),
  last_name: PropTypes.string,
});

// Default export for convenience
export default {
  idType,
  nameItemShape,
  nameWithRatingShape,
  matchParticipantShape,
  matchShape,
  selectOptionShape,
  statsItemShape,
  toastShape,
  userShape,
  filtersShape,
  highlightGroupShape,
  dragOffsetShape,
  volumeShape,
  gradeShape,
  catNameShape,
};
