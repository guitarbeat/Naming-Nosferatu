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
>(function NavbarLink(
	{ item, onClick, className = "app-navbar__link", showIcon = true, onKeyDown },
	ref,
) {
	const Icon = item.icon;

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
			<span className="app-navbar__link-text">{item.shortLabel || item.label}</span>
		</button>
	);
});
