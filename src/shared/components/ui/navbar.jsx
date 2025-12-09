/**
 * @module Navbar
 * @description Shadcn-style navbar component for collapsible navigation
 */

import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import { STORAGE_KEYS, NAVBAR } from "@core/constants";
import useLocalStorage from "@core/hooks/useLocalStorage";
import "./navbar.css";

// Navbar Context
const NavbarContext = createContext(null);
const defaultNavbarContext = {
  collapsed: false,
  collapsedWidth: NAVBAR.COLLAPSED_WIDTH,
  toggleCollapsed: () => {},
};
let hasLoggedNavbarWarning = false;

export const useNavbar = () => {
  const context = useContext(NavbarContext);
  if (!context) {
    if (!hasLoggedNavbarWarning) {
      console.warn(
        "[Navbar] useNavbar called without provider. Falling back to defaults."
      );
      hasLoggedNavbarWarning = true;
    }
    return defaultNavbarContext;
  }
  return context;
};

// NavbarProvider
export function NavbarProvider({ children }) {
  // * Use centralized localStorage hook to avoid duplication and improve error handling
  const [collapsed, setCollapsed] = useLocalStorage(
    STORAGE_KEYS.NAVBAR_COLLAPSED,
    false
  );

  // * Use centralized constant to avoid duplication
  const collapsedWidth = NAVBAR.COLLAPSED_WIDTH;
  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, [setCollapsed]);

  const value = useMemo(
    () => ({
      collapsed,
      collapsedWidth,
      toggleCollapsed,
    }),
    [collapsed, toggleCollapsed]
  );

  return (
    <NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>
  );
}

NavbarProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Navbar
export function Navbar({ children, className = "", ...rest }) {
  const classNames = ["navbar", className].filter(Boolean).join(" ");
  return (
    <nav className={classNames} {...rest}>
      {children}
    </nav>
  );
}

Navbar.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// NavbarContent - Internal component, not exported
function NavbarContent({ children, className = "" }) {
  return <div className={`navbar-content ${className}`}>{children}</div>;
}

NavbarContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// NavbarGroup
export function NavbarGroup({
  children,
  className = "",
  open = true,
  ...rest
}) {
  const classNames = [
    "navbar-group",
    open ? "navbar-group--open" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} data-state={open ? "open" : "closed"} {...rest}>
      {children}
    </div>
  );
}

NavbarGroup.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  open: PropTypes.bool,
};

// NavbarGroupLabel
function NavbarGroupLabel({ children, className = "" }) {
  return <div className={`navbar-group-label ${className}`}>{children}</div>;
}

NavbarGroupLabel.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// NavbarGroupContent
export const NavbarGroupContent = forwardRef(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div ref={ref} className={`navbar-group-content ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

NavbarGroupContent.displayName = "NavbarGroupContent";

NavbarGroupContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// NavbarMenu
function NavbarMenu({ children, className = "" }) {
  return <ul className={`navbar-menu ${className}`}>{children}</ul>;
}

NavbarMenu.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// NavbarMenuItem
export function NavbarMenuItem({ children, className = "", ...props }) {
  return (
    <li className={`navbar-menu-item ${className}`} {...props}>
      {children}
    </li>
  );
}

NavbarMenuItem.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// NavbarMenuButton
export const NavbarMenuButton = forwardRef(
  ({ children, className = "", asChild = false, ...props }, ref) => {
    if (asChild && isValidElement(children)) {
      // eslint-disable-next-line react-hooks/refs
      return cloneElement(children, {
        ref,
        className: `navbar-menu-button ${children.props.className || ""} ${className}`,
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        className={`navbar-menu-button ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

NavbarMenuButton.displayName = "NavbarMenuButton";

NavbarMenuButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  asChild: PropTypes.bool,
};

// NavbarSection - Consolidated from AppNavbar/NavbarSection.jsx
export const NavbarSection = forwardRef(
  ({ children, className = "", alignRight = false, ...props }, ref) => {
    const baseClass = alignRight
      ? "navbar-section navbar-section--right"
      : "navbar-section navbar-section--left";

    return (
      <div ref={ref} className={`${baseClass} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

NavbarSection.displayName = "NavbarSection";

NavbarSection.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  alignRight: PropTypes.bool,
};
