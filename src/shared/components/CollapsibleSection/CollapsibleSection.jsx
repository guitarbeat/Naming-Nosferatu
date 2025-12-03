/**
 * @module CollapsibleSection
 * @description Reusable collapsible section component with consistent styling.
 * Combines CollapsibleHeader and CollapsibleContent with built-in state management.
 */

import PropTypes from "prop-types";
import { CollapsibleHeader, CollapsibleContent } from "../CollapsibleHeader";
import { useCollapsible } from "../../hooks/useCollapsible";

/**
 * Collapsible Section Component
 * A convenience wrapper that combines CollapsibleHeader, CollapsibleContent,
 * and useCollapsible hook into a single component.
 *
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.icon - Emoji icon for the title
 * @param {React.ReactNode} props.summary - Content to show when collapsed
 * @param {React.ReactNode} props.actions - Action buttons in header
 * @param {React.ReactNode} props.children - Section content
 * @param {string} props.storageKey - localStorage key for persistence
 * @param {boolean} props.defaultCollapsed - Default collapsed state
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Style variant: 'default' | 'compact'
 */
export function CollapsibleSection({
  title,
  icon,
  summary,
  actions,
  children,
  storageKey = null,
  defaultCollapsed = false,
  className = "",
  variant = "default",
}) {
  const { isCollapsed, toggleCollapsed } = useCollapsible(
    storageKey,
    defaultCollapsed,
  );

  const contentId = `collapsible-${title?.toLowerCase().replace(/\s+/g, "-") || "section"}-content`;

  return (
    <div className={className}>
      <CollapsibleHeader
        title={title}
        icon={icon}
        isCollapsed={isCollapsed}
        onToggle={toggleCollapsed}
        summary={summary}
        actions={actions}
        contentId={contentId}
        variant={variant}
      />
      <CollapsibleContent id={contentId} isCollapsed={isCollapsed}>
        {children}
      </CollapsibleContent>
    </div>
  );
}

CollapsibleSection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string,
  summary: PropTypes.node,
  actions: PropTypes.node,
  children: PropTypes.node.isRequired,
  storageKey: PropTypes.string,
  defaultCollapsed: PropTypes.bool,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "compact"]),
};

export default CollapsibleSection;
