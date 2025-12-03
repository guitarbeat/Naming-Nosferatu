/**
 * @module CalendarButton
 * @description Button that exports tournament results to Google Calendar.
 */
import React from "react";
import PropTypes from "prop-types";
import Button from "../Button";
import { isNameHidden } from "../../utils/nameFilterUtils";
import styles from "./CalendarButton.module.css";

function CalendarButton({
  rankings,
  userName,
  className = "",
  variant = "secondary",
  size = "medium",
  disabled = false,
  ...rest
}) {
  const { onClick: externalOnClick, ...buttonProps } = rest;

  const handleClick = (event) => {
    if (typeof externalOnClick === "function") {
      externalOnClick(event);
    }

    if (event?.defaultPrevented) return;

    // Filter out hidden names and sort by rating
    const activeNames = rankings
      .filter((name) => !isNameHidden(name))
      .sort((a, b) => (b.rating || 1500) - (a.rating || 1500));

    const winnerName = activeNames[0]?.name || "No winner yet";

    const today = new Date();
    const startDate = today.toISOString().split("T")[0].replace(/-/g, "");
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1);
    const endDateStr = endDate.toISOString().split("T")[0].replace(/-/g, "");

    const text = `🐈‍⬛ ${winnerName}`;
    const details = `Cat name rankings for ${userName}:\n\n${activeNames
      .map(
        (name, index) =>
          `${index + 1}. ${name.name} (Rating: ${Math.round(name.rating || 1500)})`,
      )
      .join("\n")}`;

    const baseUrl = "https://calendar.google.com/calendar/render";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text,
      details,
      dates: `${startDate}/${endDateStr}`,
      ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    window.open(`${baseUrl}?${params.toString()}`, "_blank");
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      disabled={disabled}
      startIcon={<span className={styles.icon}>📅</span>}
      aria-label="Add to Google Calendar"
      title="Add to Google Calendar"
      {...buttonProps}
    >
      Add to Calendar
    </Button>
  );
}

CalendarButton.displayName = "CalendarButton";

CalendarButton.propTypes = {
  rankings: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      rating: PropTypes.number,
    }),
  ).isRequired,
  userName: PropTypes.string.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["primary", "secondary", "danger", "ghost"]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  disabled: PropTypes.bool,
};

export default CalendarButton;
