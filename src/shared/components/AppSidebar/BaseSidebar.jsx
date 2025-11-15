/**
 * @module Sidebar
 * @description Shadcn-style sidebar component for collapsible navigation
 */

import { cloneElement, createContext, forwardRef, isValidElement, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import './BaseSidebar.css';

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

