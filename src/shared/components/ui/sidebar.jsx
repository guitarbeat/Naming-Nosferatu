/**
 * @module Sidebar
 * @description Shadcn-style sidebar component for collapsible navigation
 */

import { cloneElement, createContext, forwardRef, isValidElement, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import './sidebar.css';

// Sidebar Context
const SidebarContext = createContext({
  collapsed: false,
  toggleCollapsed: () => {},
  collapsedWidth: 56
});

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

// SidebarProvider
export function SidebarProvider({ children, collapsedWidth = 56, defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = () => setCollapsed(prev => !prev);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed, collapsedWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

SidebarProvider.propTypes = {
  children: PropTypes.node.isRequired,
  collapsedWidth: PropTypes.number,
  defaultCollapsed: PropTypes.bool
};

// Sidebar
export function Sidebar({ children, className = '', collapsible = true }) {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${className}`}
      data-collapsible={collapsible}
    >
      {children}
    </aside>
  );
}

Sidebar.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  collapsible: PropTypes.bool
};

// SidebarTrigger
export function SidebarTrigger({ className = '' }) {
  const { toggleCollapsed } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggleCollapsed}
      className={`sidebar-trigger ${className}`}
      aria-label="Toggle sidebar"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
      </svg>
    </button>
  );
}

SidebarTrigger.propTypes = {
  className: PropTypes.string
};

// SidebarContent
export function SidebarContent({ children, className = '' }) {
  return (
    <div className={`sidebar-content ${className}`}>
      {children}
    </div>
  );
}

SidebarContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

// SidebarGroup
export function SidebarGroup({ children, className = '', open = true, ...rest }) {
  const classNames = [
    'sidebar-group',
    open ? 'sidebar-group--open' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} data-state={open ? 'open' : 'closed'} {...rest}>
      {children}
    </div>
  );
}

SidebarGroup.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  open: PropTypes.bool
};

// SidebarGroupLabel
export function SidebarGroupLabel({ children, className = '' }) {
  return (
    <div className={`sidebar-group-label ${className}`}>
      {children}
    </div>
  );
}

SidebarGroupLabel.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

// SidebarGroupContent
export function SidebarGroupContent({ children, className = '' }) {
  return (
    <div className={`sidebar-group-content ${className}`}>
      {children}
    </div>
  );
}

SidebarGroupContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

// SidebarMenu
export function SidebarMenu({ children, className = '' }) {
  return (
    <ul className={`sidebar-menu ${className}`}>
      {children}
    </ul>
  );
}

SidebarMenu.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

// SidebarMenuItem
export function SidebarMenuItem({ children, className = '' }) {
  return (
    <li className={`sidebar-menu-item ${className}`}>
      {children}
    </li>
  );
}

SidebarMenuItem.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

// SidebarMenuButton
export const SidebarMenuButton = forwardRef(
  ({ children, className = '', asChild = false, ...props }, ref) => {
    const { collapsed } = useSidebar();

    if (asChild && isValidElement(children)) {
      // eslint-disable-next-line react-hooks/refs
      return cloneElement(children, {
        ref,
        className: `sidebar-menu-button ${collapsed ? 'sidebar-menu-button--collapsed' : ''} ${children.props.className || ''} ${className}`,
        ...props
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        className={`sidebar-menu-button ${collapsed ? 'sidebar-menu-button--collapsed' : ''} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

SidebarMenuButton.displayName = 'SidebarMenuButton';

SidebarMenuButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  asChild: PropTypes.bool
};
