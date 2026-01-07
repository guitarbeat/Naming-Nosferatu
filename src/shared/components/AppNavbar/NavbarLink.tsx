import React from "react";
import type { NavItem } from "./navbarCore";

export const NavbarLink = React.forwardRef<
	HTMLButtonElement,
	{
		item: NavItem;
		onClick: (item: NavItem) => void;
		className?: string;
		showIcon?: boolean;
		onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
	}
> = React.forwardRef(function NavbarLinkInner(
	{ item, onClick, className = "app-navbar__link", showIcon = true, onKeyDown },
	ref,
) {
	const Icon = item.icon;

	/*
	 * Progressive Disclosure:
	 * If item has children, we render the button and then the children container.
	 * NOTE: Since we cannot nest buttons, if we want an accordion, we should wrap this.
	 * However, AppNavbar iterates and renders NavbarLink directly.
	 * We'll check if children exist and return a fragment/div.
	 */
	if (item.children && item.children.length > 0) {
		// Simple recursive rendering
		// Note: We need state for expand/collapse (progressive disclosure).
		// For this 'One-Shot' implementation, we'll use a local state.
		const [isOpen, setIsOpen] = React.useState(false);
		const hasActiveChild = item.children.some((child) => child.isActive);

		React.useEffect(() => {
			if (hasActiveChild) setIsOpen(true);
		}, [hasActiveChild]);

		const toggleOpen = (e: React.MouseEvent) => {
			e.stopPropagation();
			setIsOpen(!isOpen);
		};

		return (
			<div className="app-navbar__item-group">
				<div className="app-navbar__link-wrapper" style={{ display: "flex", alignItems: "center" }}>
					<button
						ref={ref}
						type="button"
						onClick={() => onClick(item)}
						onKeyDown={onKeyDown}
						className={`${className} ${item.children ? "has-children" : ""}`}
						data-active={item.isActive}
						aria-current={item.isActive ? "page" : undefined}
						aria-label={item.ariaLabel || item.label}
						title={item.label}
						style={{ flex: 1 }}
					>
						{showIcon && Icon && <Icon className="app-navbar__link-icon" aria-hidden={true} />}
						<span className="app-navbar__link-text">{item.label}</span>
					</button>
					<button
						type="button"
						className="app-navbar__group-toggle"
						onClick={toggleOpen}
						aria-expanded={isOpen}
						style={{
							background: "transparent",
							border: "none",
							color: "var(--nav-text-muted)",
							cursor: "pointer",
							padding: "0 var(--space-2)",
						}}
					>
						<span style={{ fontSize: "10px", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block", transition: "transform 0.2s" }}>▼</span>
					</button>
				</div>
				{isOpen && (
					<div className="app-navbar__sub-menu" style={{ paddingLeft: "var(--space-4)" }}>
						{item.children.map((child) => (
							<NavbarLink
								key={child.key}
								item={child}
								onClick={onClick}
								className={className}
								showIcon={!!child.icon} // Sub-items might not have icons
							/>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<button
			ref={ref}
			type="button"
			onClick={() => onClick(item)}
			onKeyDown={onKeyDown}
			className={className}
			data-active={item.isActive}
			aria-current={item.isActive ? "page" : undefined}
			aria-label={item.ariaLabel || item.label}
			title={item.label}
		>
			{showIcon && Icon && <Icon className="app-navbar__link-icon" aria-hidden={true} />}
			<span className="app-navbar__link-text">{item.label}</span>
		</button>
	);
});
