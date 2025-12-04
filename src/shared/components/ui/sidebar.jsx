/**
 * @module Sidebar
 * @description Shadcn-style sidebar component for collapsible navigation
 */

import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
} from "react";
import PropTypes from "prop-types";
import "./sidebar.css";

// Sidebar Context (simplified - no collapse state)
const SidebarContext = createContext({});

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

// SidebarProvider
export function SidebarProvider({ children }) {
  return (
    <SidebarContext.Provider value={{}}>{children}</SidebarContext.Provider>
  );
}

SidebarProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Sidebar
export function Sidebar({ children, className = "" }) {
  return <aside className={`sidebar ${className}`}>{children}</aside>;
}

Sidebar.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// SidebarContent
export function SidebarContent({ children, className = "" }) {
  return <div className={`sidebar-content ${className}`}>{children}</div>;
}

SidebarContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// SidebarGroup
export function SidebarGroup({
  children,
  className = "",
  open = true,
  ...rest
}) {
  const classNames = [
    "sidebar-group",
    open ? "sidebar-group--open" : "",
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

SidebarGroup.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  open: PropTypes.bool,
};

// SidebarGroupLabel
function SidebarGroupLabel({ children, className = "" }) {
  return <div className={`sidebar-group-label ${className}`}>{children}</div>;
}

SidebarGroupLabel.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// SidebarGroupContent
export function SidebarGroupContent({ children, className = "" }) {
  return <div className={`sidebar-group-content ${className}`}>{children}</div>;
}

SidebarGroupContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// SidebarMenu
function SidebarMenu({ children, className = "" }) {
  return <ul className={`sidebar-menu ${className}`}>{children}</ul>;
}

SidebarMenu.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// SidebarMenuItem
export function SidebarMenuItem({ children, className = "" }) {
  return <li className={`sidebar-menu-item ${className}`}>{children}</li>;
}

SidebarMenuItem.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// SidebarMenuButton
export const SidebarMenuButton = forwardRef(
  ({ children, className = "", asChild = false, ...props }, ref) => {
    if (asChild && isValidElement(children)) {
      // eslint-disable-next-line react-hooks/refs
      return cloneElement(children, {
        ref,
        className: `sidebar-menu-button ${children.props.className || ""} ${className}`,
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        className={`sidebar-menu-button ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

SidebarMenuButton.displayName = "SidebarMenuButton";

SidebarMenuButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  asChild: PropTypes.bool,
};
