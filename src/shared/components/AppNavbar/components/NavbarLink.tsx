import type { NavItem } from "../types";

export function NavbarLink({
	item,
	onClick,
	className = "app-navbar__link",
	showIcon = true,
}: {
	item: NavItem;
	onClick: (item: NavItem) => void;
	className?: string;
	showIcon?: boolean;
}) {
	const Icon = item.icon;

	return (
		<button
			type="button"
			onClick={() => onClick(item)}
			className={className}
			data-active={item.isActive}
			aria-current={item.isActive ? "page" : undefined}
			aria-label={item.ariaLabel || item.label}
			title={item.label}
		>
			{showIcon && Icon && (
				<Icon className="app-navbar__link-icon" aria-hidden />
			)}
			<span className="app-navbar__link-text">
				{item.shortLabel || item.label}
			</span>
		</button>
	);
}
