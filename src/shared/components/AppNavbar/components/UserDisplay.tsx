const MAX_NAME_LENGTH = 18;

export function UserDisplay({
	userName,
	isAdmin = false,
}: {
	userName: string;
	isAdmin?: boolean;
}) {
	if (!userName) return null;

	const truncatedUserName =
		userName.length > MAX_NAME_LENGTH
			? `${userName.substring(0, MAX_NAME_LENGTH)}...`
			: userName;

	return (
		<div className="navbar-user-display">
			<div className="navbar-avatar-placeholder">
				{userName.charAt(0).toUpperCase()}
			</div>
			<div className="navbar-user-info">
				<span className="navbar-user-name">{truncatedUserName}</span>
				{isAdmin && <span className="navbar-admin-badge">Admin</span>}
			</div>
		</div>
	);
}
