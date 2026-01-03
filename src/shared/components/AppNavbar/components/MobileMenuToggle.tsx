export function MobileMenuToggle({
	isOpen,
	onToggle,
}: {
	isOpen: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			className="app-navbar__toggle"
			aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
			aria-expanded={isOpen}
			aria-controls="app-navbar-mobile-panel"
			onClick={onToggle}
		>
			<div className="hamburger-icon">
				<span />
				<span />
				<span />
			</div>
		</button>
	);
}
