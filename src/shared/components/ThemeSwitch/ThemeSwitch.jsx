import { useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./ThemeSwitch.css";

function ThemeSwitch({ currentTheme, onToggle }) {
  const switchRef = useRef(null);

  const handleClick = useCallback(() => {
    onToggle?.();
  }, [onToggle]);

  const handleMouseMove = useCallback((e) => {
    if (!switchRef.current) return;
    const rect = switchRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    switchRef.current.style.setProperty("--mouse-x", `${x}%`);
    switchRef.current.style.setProperty("--mouse-y", `${y}%`);
  }, []);

  useEffect(() => {
    const element = switchRef.current;
    if (!element) return;

    element.addEventListener("mousemove", handleMouseMove);
    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  const isLight = currentTheme === "light";

  return (
    <button
      ref={switchRef}
      type="button"
      className={`theme-switch ${isLight ? "light-theme" : ""}`}
      onClick={handleClick}
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
      aria-pressed={isLight}
      role="switch"
    >
      <span className="switch-handle" />
    </button>
  );
}

ThemeSwitch.propTypes = {
  currentTheme: PropTypes.oneOf(["light", "dark"]).isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default ThemeSwitch;
