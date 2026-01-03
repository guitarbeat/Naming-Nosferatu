import { Button } from "@heroui/react";
import { LogoutIcon, SuggestIcon } from "./Icons";
import { UserDisplay } from "./UserDisplay";

export function NavbarActions({
	isLoggedIn,
	userName,
	isAdmin,
	onLogout,
	onOpenSuggestName,
}: {
	isLoggedIn: boolean;
	userName?: string;
	isAdmin?: boolean;
	onLogout: () => void;
	onOpenSuggestName?: () => void;
}) {
	return (
		<div className="app-navbar__actions">
			{isLoggedIn && userName && (
				<UserDisplay userName={userName} isAdmin={isAdmin} />
			)}
			{onOpenSuggestName && (
				<Button
					onClick={onOpenSuggestName}
					className="app-navbar__action-btn app-navbar__action-btn--suggest"
					aria-label="Suggest a name"
					title="Suggest a new cat name"
				>
					<SuggestIcon aria-hidden />
					<span className="app-navbar__btn-text">Suggest</span>
				</Button>
			)}
			{isLoggedIn && (
				<Button
					onClick={onLogout}
					className="app-navbar__action-btn app-navbar__action-btn--logout"
					aria-label="Log out"
					title="Log out"
				>
					<LogoutIcon aria-hidden />
				</Button>
			)}
		</div>
	);
}
