import type React from "react";
import { createContext, useContext } from "react";
import type { NavbarContextValue } from "../types";

export const NavbarContext = createContext<NavbarContextValue | null>(null);

export const NavbarProvider = ({
	value,
	children,
}: {
	value: NavbarContextValue;
	children: React.ReactNode;
}) => {
	return (
		<NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>
	);
};

export const useNavbarContext = () => {
	const context = useContext(NavbarContext);
	if (!context) {
		throw new Error("useNavbarContext must be used within a NavbarProvider");
	}
	return context;
};
