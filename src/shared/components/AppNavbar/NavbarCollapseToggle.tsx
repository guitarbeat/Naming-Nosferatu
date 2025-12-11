/**
 * @module AppNavbar/NavbarCollapseToggle
 * @description Collapse/expand toggle button
 */

interface NavbarCollapseToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function NavbarCollapseToggle({
  isCollapsed,
  onToggle,
}: NavbarCollapseToggleProps) {
  return (
    <button
      type="button"
      className={`app-navbar__collapse-toggle ${
        isCollapsed ? "app-navbar__collapse-toggle--collapsed" : ""
      }`}
      onClick={onToggle}
      aria-label={isCollapsed ? "Show navigation bar" : "Hide navigation bar"}
      aria-expanded={!isCollapsed}
      aria-controls="app-navbar"
      title={isCollapsed ? "Show navigation" : "Hide navigation"}
    >
      <span className="app-navbar__collapse-icon" aria-hidden>
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="app-navbar__collapse-hamburger"
        >
          {isCollapsed ? (
            <>
              <path
                d="M3 12h18"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 6h18"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 18h18"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            <>
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 6l12 12"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>
      </span>
    </button>
  );
}
