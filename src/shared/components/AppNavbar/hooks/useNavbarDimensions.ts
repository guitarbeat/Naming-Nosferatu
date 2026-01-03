import { useCallback, useEffect, useState } from "react";

export interface NavbarDimensions {
	width: number;
	height: number;
}

export const useNavbarDimensions = (_isCollapsed: boolean) => {
	const [dimensions, setDimensions] = useState<NavbarDimensions>({
		width: 0,
		height: 0,
	});

	const updateDimensions = useCallback(() => {
		if (typeof window === "undefined") return;

		const navbarElement = document.getElementById("app-navbar");
		if (navbarElement) {
			const rect = navbarElement.getBoundingClientRect();
			setDimensions({
				width: rect.width,
				height: rect.height,
			});

			// Update CSS variable for the rest of the app to use
			document.documentElement.style.setProperty(
				"--navbar-height",
				`${rect.height}px`,
			);
			document.documentElement.style.setProperty(
				"--navbar-width",
				`${rect.width}px`,
			);
		}
	}, []);

	useEffect(() => {
		updateDimensions();
		// Also update after transition ends
		const timeout = setTimeout(updateDimensions, 400);

		const handleResize = () => {
			updateDimensions();
		};

		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
			clearTimeout(timeout);
		};
	}, [updateDimensions]);

	return dimensions;
};
