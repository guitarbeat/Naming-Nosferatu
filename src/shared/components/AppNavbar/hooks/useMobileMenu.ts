import { useCallback, useEffect, useState } from "react";

export const useMobileMenu = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const toggleMobileMenu = useCallback(() => {
		setIsMobileMenuOpen((prev) => !prev);
	}, []);

	const closeMobileMenu = useCallback(() => {
		setIsMobileMenuOpen(false);
	}, []);

	useEffect(() => {
		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				closeMobileMenu();
			}
		};

		if (isMobileMenuOpen) {
			document.addEventListener("keydown", handleEscapeKey);
			// Prevent scrolling when menu is open
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}

		return () => {
			document.removeEventListener("keydown", handleEscapeKey);
			document.body.style.overflow = "";
		};
	}, [isMobileMenuOpen, closeMobileMenu]);

	return {
		isMobileMenuOpen,
		toggleMobileMenu,
		closeMobileMenu,
	};
};
