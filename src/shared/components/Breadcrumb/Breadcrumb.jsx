import React from "react";
import PropTypes from "prop-types";
import "./Breadcrumb.css";

function Breadcrumb({ items, separator = "›" }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb navigation">
      <ol className="breadcrumb__list">
        {items.map((item, index) => {
          const key = item.id ?? index;
          const isCurrent = index === items.length - 1;

          const content = (
            <>
              {item.icon && (
                <span className="breadcrumb__icon" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </>
          );

          return (
            <li className="breadcrumb__item" key={key}>
              {isCurrent ? (
                <span className="breadcrumb__current" aria-current="page">
                  {content}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  className="breadcrumb__link"
                  onClick={item.onClick}
                  aria-label={item.ariaLabel}
                >
                  {content}
                </button>
              ) : item.href ? (
                <a
                  className="breadcrumb__link"
                  href={item.href}
                  aria-label={item.ariaLabel}
                >
                  {content}
                </a>
              ) : (
                <span className="breadcrumb__link" aria-label={item.ariaLabel}>
                  {content}
                </span>
              )}
              {!isCurrent && (
                <span className="breadcrumb__separator" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

Breadcrumb.displayName = "Breadcrumb";

Breadcrumb.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
      onClick: PropTypes.func,
      icon: PropTypes.node,
      ariaLabel: PropTypes.string,
    }),
  ).isRequired,
  separator: PropTypes.string,
};

export default Breadcrumb;
