export function NavbarCollapseToggle({
	isCollapsed,
	onToggle,
}: {
	isCollapsed: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className="app-navbar__collapse-toggle"
			aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
			aria-expanded={!isCollapsed}
			title={isCollapsed ? "Expand" : "Collapse"}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width={20}
				height={20}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
				className={`app-navbar__collapse-icon ${isCollapsed ? "collapsed" : ""}`}
				aria-hidden
			>
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>
	);
}
