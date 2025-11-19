import React, { memo } from "react";
import PropTypes from "prop-types";
import Card from "../Card";
import styles from "./StatsCard.module.css";

/**
 * Generic stats card component used across the app.
 * Accepts optional label/title and emoji to support
 * different layouts in parent components.
 */
function StatsCard({
  title,
  label,
  value,
  emoji,
  variant: tone = "default",
  className = "",
  labelClassName = "",
  valueClassName = "",
  emojiClassName = "",
  cardVariant = "elevated",
  cardPadding = "medium",
  cardShadow = "medium",
  cardBackground = "glass",
  ...rest
}) {
  const labelText = title || label || "Statistic";
  const valueText =
    typeof value === "string" || typeof value === "number" ? value : "";
  const ariaLabel = valueText ? `${labelText}: ${valueText}` : labelText;
  const cardClasses = [
    styles.card,
    tone !== "default" && styles[tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Card
      variant={cardVariant}
      padding={cardPadding}
      shadow={cardShadow}
      background={cardBackground}
      className={cardClasses}
      role="status"
      aria-label={ariaLabel}
      {...rest}
    >
      {title ? (
        <h3 className={`${styles.label} ${labelClassName}`.trim()}>{title}</h3>
      ) : (
        <span className={`${styles.label} ${labelClassName}`.trim()}>
          {label}
        </span>
      )}
      <span className={`${styles.value} ${valueClassName}`.trim()}>
        {value}
      </span>
      {emoji && (
        <span className={`${styles.emoji} ${emojiClassName}`.trim()}>
          {emoji}
        </span>
      )}
    </Card>
  );
}

StatsCard.propTypes = {
  title: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.node,
  ]).isRequired,
  emoji: PropTypes.node,
  variant: PropTypes.oneOf([
    "default",
    "primary",
    "success",
    "warning",
    "info",
    "danger",
  ]),
  className: PropTypes.string,
  labelClassName: PropTypes.string,
  valueClassName: PropTypes.string,
  emojiClassName: PropTypes.string,
  cardVariant: PropTypes.oneOf(["default", "elevated", "outlined", "filled"]),
  cardPadding: PropTypes.oneOf(["none", "small", "medium", "large", "xl"]),
  cardShadow: PropTypes.oneOf(["none", "small", "medium", "large", "xl"]),
  cardBackground: PropTypes.oneOf([
    "solid",
    "glass",
    "gradient",
    "transparent",
  ]),
};

export default memo(StatsCard);
