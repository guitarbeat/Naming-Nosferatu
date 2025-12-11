import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import LiquidGlass from "./LiquidGlass";

/**
 * LiquidGlassToggleButton
 * A pill-shaped glass button that swaps its label on click.
 */
function LiquidGlassToggleButton({
  labelOn = "On",
  labelOff = "Off",
  initialState = false,
  onToggle,
  width = 220,
  height = 72,
  radius = 36,
  className = "",
  ...props
}) {
  const [isOn, setIsOn] = useState(initialState);

  const currentLabel = useMemo(
    () => (isOn ? labelOn : labelOff),
    [isOn, labelOn, labelOff]
  );

  const handleClick = () => {
    const next = !isOn;
    setIsOn(next);
    if (onToggle) {
      onToggle(next);
    }
  };

  return (
    <LiquidGlass
      width={width}
      height={height}
      radius={radius}
      className={`liquid-glass-button-shell ${className}`}
      {...props}
    >
      <button
        type="button"
        className="liquid-glass-button"
        onClick={handleClick}
        aria-pressed={isOn}
        aria-label={`Toggle ${labelOff}/${labelOn}`}
      >
        {currentLabel}
      </button>
    </LiquidGlass>
  );
}

LiquidGlassToggleButton.propTypes = {
  labelOn: PropTypes.string,
  labelOff: PropTypes.string,
  initialState: PropTypes.bool,
  onToggle: PropTypes.func,
  width: PropTypes.number,
  height: PropTypes.number,
  radius: PropTypes.number,
  className: PropTypes.string,
};

export default LiquidGlassToggleButton;
