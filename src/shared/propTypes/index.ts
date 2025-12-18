/**
 * @module propTypes
 * @description Shared PropTypes definitions for common data shapes.
 * Centralizes PropTypes to ensure consistency and reduce duplication.
 */

import PropTypes from "prop-types";

/**
 * Common ID type - can be string or number
 */
const idType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

/**
 * Name item shape - used in rankings, highlights, charts
 */
export const nameItemShape = PropTypes.shape({
  id: idType,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});
