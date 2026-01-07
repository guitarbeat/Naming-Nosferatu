import Button from "../Button/Button";
import { LogoutIcon, SuggestIcon } from "./NavbarIcons";

const MAX_NAME_LENGTH = 18;

function UserDisplay({ userName, isAdmin = false }: { userName: string; isAdmin?: boolean }) {
	if (!userName) {
		return null;
	}

	const truncatedUserName =
		userName.length > MAX_NAME_LENGTH ? `${userName.substring(0, MAX_NAME_LENGTH)}...` : userName;

	return (
		<div className="navbar-user-display">
			<div className="navbar-avatar-placeholder">{userName.charAt(0).toUpperCase()}</div>
			<div className="navbar-user-info">
				<span className="navbar-user-name">{truncatedUserName}</span>
				{isAdmin && <span className="navbar-admin-badge">Admin</span>}
			</div>
		</div>
	);
}

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
			{isLoggedIn && userName && <UserDisplay userName={userName} isAdmin={isAdmin} />}
			{onOpenSuggestName && (
				<Button
					onClick={onOpenSuggestName}
					className="app-navbar__action-btn app-navbar__action-btn--suggest"
					aria-label="Suggest a name"
					title="Suggest a new cat name"
				>
					<SuggestIcon aria-hidden={true} />
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
					<LogoutIcon aria-hidden={true} />
				</Button>
			)}
		</div>
	);
}
