/**
 * @module context
 * @description React context for navigation state management
 */

import { createContext, useContext } from "react";
import type { NavbarContextValue } from "./types";

/**
 * Navigation context
 */
export const NavbarContext = createContext<NavbarContextValue | null>(null);

/**
 * Navigation context provider component
 */
export const NavbarProvider = ({
	value,
	children,
}: {
	value: NavbarContextValue;
	children: React.ReactNode;
}) => {
	return <NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>;
};

/**
 * Hook to access navigation context
 * @throws {Error} If used outside of NavbarProvider
 */
export const useNavbarContext = () => {
	const context = useContext(NavbarContext);
	if (!context) {
		throw new Error("useNavbarContext must be used within a NavbarProvider");
	}
	return context;
};
