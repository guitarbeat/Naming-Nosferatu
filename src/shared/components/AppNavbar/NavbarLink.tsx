import React from "react";
import type { NavItem } from "../../navigation";

export const NavbarLink = React.forwardRef<
	HTMLButtonElement,
	{
		item: NavItem;
		onClick: (item: NavItem) => void;
		className?: string;
		showIcon?: boolean;
		onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
	}
>(function NavbarLinkInner(
	{ item, onClick, className = "app-navbar__link", showIcon = true, onKeyDown },
	ref,
) {
	const Icon = item.icon;
	const hasChildren = item.children && item.children.length > 0;

	// Always call hooks at the top level
	const [_isOpen, setIsOpen] = React.useState(false);
	const hasActiveChild = hasChildren
		? (item.children?.some((child) => child.isActive) ?? false)
		: false;

	React.useEffect(() => {
		if (hasActiveChild) {
			setIsOpen(true);
		}
	}, [hasActiveChild]);

	/*
	 * Progressive Disclosure:
	 * If item has children, we render the button and then the children container.
	 * NOTE: Since we cannot nest buttons, if we want an accordion, we should wrap this.
	 * However, AppNavbar iterates and renders NavbarLink directly.
	 * We'll check if children exist and return a fragment/div.
	 */
	// For items with children, just navigate directly (no dropdown in top nav)
	if (hasChildren) {
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
