import React from 'react';
import PropTypes from 'prop-types';
import './Breadcrumb.css';
function Breadcrumb({
  items,
  separator = '›'
}) {
  if (!items || items.length === 0) {
    return null;
  }
  return <nav className="breadcrumb" aria-label="Breadcrumb navigation">
      
    </nav>;
}
Breadcrumb.displayName = 'Breadcrumb';
Breadcrumb.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string.isRequired,
    href: PropTypes.string,
    onClick: PropTypes.func,
    icon: PropTypes.node,
    ariaLabel: PropTypes.string
  })).isRequired,
  separator: PropTypes.string
};
export default Breadcrumb;