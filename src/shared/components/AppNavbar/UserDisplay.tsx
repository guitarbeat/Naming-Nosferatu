/**
 * @module AppNavbar/UserDisplay
 * @description User information display component
 */

interface UserDisplayProps {
  userName: string;
  isAdmin?: boolean;
}

const MAX_NAME_LENGTH = 18;

export function UserDisplay({ userName, isAdmin = false }: UserDisplayProps) {
  if (!userName) return null;

  const truncatedUserName =
    userName.length > MAX_NAME_LENGTH
      ? `${userName.substring(0, MAX_NAME_LENGTH)}...`
      : userName;

  return (
    <div className="navbar-user-display">
      <div className="navbar-user-display__content">
        <div className="navbar-user-display__text">
          <span className="navbar-user-display__name">{truncatedUserName}</span>
          {isAdmin && (
            <span
              className="navbar-user-display__admin-label"
              aria-label="Admin"
            >
              Admin
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
