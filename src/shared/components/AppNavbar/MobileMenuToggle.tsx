/**
 * @module AppNavbar/MobileMenuToggle
 * @description Mobile menu hamburger toggle button
 */

interface MobileMenuToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileMenuToggle({ isOpen, onToggle }: MobileMenuToggleProps) {
  return (
    <button
      type="button"
      className="app-navbar__toggle"
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      aria-controls="app-navbar-mobile-panel"
      onClick={onToggle}
    >
      <span />
      <span />
      <span />
    </button>
  );
}
