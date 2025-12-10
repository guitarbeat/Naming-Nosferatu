/**
 * @module Navbar (Shadcn/ui-based)
 * @description Simplified navbar component using shadcn/ui and Radix UI primitives
 */

import {
  createContext,
  forwardRef,
  useContext,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Separator } from "@radix-ui/react-separator";
import { STORAGE_KEYS, NAVBAR } from "@core/constants";
import useLocalStorage from "@core/hooks/useLocalStorage";
import "./navbar.css";

/* ============================================================================
   NAVBAR CONTEXT - Handle collapse state
   ========================================================================== */

const NavbarContext = createContext(null);

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (!context) {
    console.warn(
      "[Navbar] useNavbar called without provider. Falling back to defaults."
    );
    return {
      collapsed: false,
      collapsedWidth: NAVBAR.COLLAPSED_WIDTH,
      toggleCollapsed: () => {},
    };
  }
  return context;
}

export function NavbarProvider({ children }) {
  const [collapsed, setCollapsed] = useLocalStorage(
    STORAGE_KEYS.NAVBAR_COLLAPSED,
    false
  );

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

/* ============================================================================
   BASIC NAVBAR COMPONENTS
   ========================================================================== */

export const Navbar = forwardRef(
  ({ children, className = "", ...rest }, ref) => {
    return (
      <nav
        ref={ref}
        className={`navbar ${className}`.trim()}
        role="navigation"
        {...rest}
      >
        {children}
      </nav>
    );
  }
);

Navbar.displayName = "Navbar";
Navbar.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export const NavbarContent = forwardRef(
  ({ children, className = "", ...rest }, ref) => {
    return (
      <div ref={ref} className={`navbar-content ${className}`.trim()} {...rest}>
        {children}
      </div>
    );
  }
);

NavbarContent.displayName = "NavbarContent";
NavbarContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

/* ============================================================================
   NAVBAR SECTIONS - Layout helpers
   ========================================================================== */

export const NavbarSection = forwardRef(
  ({ children, className = "", alignRight = false, ...rest }, ref) => {
    const baseClass = alignRight
      ? "navbar-section navbar-section--right"
      : "navbar-section navbar-section--left";

    return (
      <div ref={ref} className={`${baseClass} ${className}`.trim()} {...rest}>
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

export const NavbarSeparator = forwardRef((props, ref) => (
  <Separator ref={ref} className="navbar-separator" orientation="vertical" {...props} />
));

NavbarSeparator.displayName = "NavbarSeparator";

/* ============================================================================
   MENU COMPONENTS - Using Radix Dropdown
   ========================================================================== */

export const NavbarMenu = forwardRef(
  ({ children, className = "", ...rest }, ref) => {
    return (
      <ul
        ref={ref}
        className={`navbar-menu ${className}`.trim()}
        role="menu"
        {...rest}
      >
        {children}
      </ul>
    );
  }
);

NavbarMenu.displayName = "NavbarMenu";
NavbarMenu.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export const NavbarMenuItem = forwardRef(
  ({ children, className = "", ...rest }, ref) => {
    return (
      <li ref={ref} className={`navbar-menu-item ${className}`.trim()} {...rest}>
        {children}
      </li>
    );
  }
);

NavbarMenuItem.displayName = "NavbarMenuItem";
NavbarMenuItem.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export const NavbarMenuButton = forwardRef(
  ({ children, className = "", asChild = false, ...rest }, ref) => {
    const buttonClass = `navbar-menu-button ${className}`.trim();

    return (
      <button
        ref={ref}
        type="button"
        className={buttonClass}
        {...rest}
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

/* ============================================================================
   DROPDOWN MENU - Using Radix Dropdown
   ========================================================================== */

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuContent = forwardRef(
  ({ className = "", ...rest }, ref) => (
    <DropdownMenuPrimitive.Content
      ref={ref}
      className={`navbar-dropdown-content ${className}`.trim()}
      sideOffset={8}
      {...rest}
    />
  )
);
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = forwardRef(
  ({ className = "", ...rest }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={`navbar-dropdown-item ${className}`.trim()}
      {...rest}
    />
  )
);
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuSeparator = forwardRef(
  ({ className = "", ...rest }, ref) => (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={`navbar-dropdown-separator ${className}`.trim()}
      {...rest}
    />
  )
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

/* ============================================================================
   ICON BUTTON - For action items
   ========================================================================== */

export const NavbarIconButton = forwardRef(
  ({ children, className = "", ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`navbar-icon-button ${className}`.trim()}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

NavbarIconButton.displayName = "NavbarIconButton";
NavbarIconButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
