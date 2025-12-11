/**
 * @module AppNavbar/NavbarBrand
 * @description Brand/logo button component
 */

interface NavbarBrandProps {
  isActive: boolean;
  onClick: () => void;
  ariaLabel: string;
}

export function NavbarBrand({ isActive, onClick, ariaLabel }: NavbarBrandProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-navbar__brand"
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      aria-label={ariaLabel}
    >
      Tournament
      <small>Daily bracket</small>
    </button>
  );
}
