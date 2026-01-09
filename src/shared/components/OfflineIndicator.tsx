import type React from "react";
import { useEffect, useState } from "react";
import { useNetworkStatus } from "../hooks/useBrowserState";
// Styles consolidated in src/shared/styles/components-primitives.css

interface OfflineIndicatorProps {
	showWhenOnline?: boolean;
	position?: "top" | "bottom";
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
	showWhenOnline = false,
	position = "top",
}) => {
	const { isOnline, isSlowConnection } = useNetworkStatus();
	const [showIndicator, setShowIndicator] = useState(false);
	const [justCameOnline, setJustCameOnline] = useState(false);

	useEffect(() => {
		if (!isOnline) {
			setShowIndicator(true);
			setJustCameOnline(false);
		} else if (showWhenOnline || justCameOnline) {
			setShowIndicator(true);
			if (!justCameOnline) {
				setJustCameOnline(true);
				// Hide the "back online" message after 3 seconds
				setTimeout(() => {
					setShowIndicator(false);
					setJustCameOnline(false);
				}, 3000);
			}
		} else {
			setShowIndicator(false);
		}
	}, [isOnline, showWhenOnline, justCameOnline]);

	if (!showIndicator) {
		return null;
	}

	const getStatusMessage = () => {
		if (!isOnline) {
			return "You are offline";
		}
		if (justCameOnline) {
			return "Back online";
		}
		if (isSlowConnection) {
			return "Slow connection detected";
		}
		return "Connected";
	};

	const getStatusClass = () => {
		if (!isOnline) {
			return "offline";
		}
		if (justCameOnline) {
			return "online";
		}
		if (isSlowConnection) {
			return "slow";
		}
		return "online";
	};

	return (
		<div className={`indicator ${position} ${getStatusClass()}`}>
			<div className="indicator-content">
				<span className="indicator-dot" />
				<span className="indicator-message">{getStatusMessage()}</span>
			</div>
		</div>
	);
};
