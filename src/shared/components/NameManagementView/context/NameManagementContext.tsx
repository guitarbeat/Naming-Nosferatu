import type React from "react";
import { createContext, useContext } from "react";
import type { NameManagementContextType } from "../types";

export const NameManagementContext =
	createContext<NameManagementContextType | null>(null);

export const NameManagementProvider = ({
	value,
	children,
}: {
	value: NameManagementContextType;
	children: React.ReactNode;
}) => {
	return (
		<NameManagementContext.Provider value={value}>
			{children}
		</NameManagementContext.Provider>
	);
};

export const useNameManagementContext = () => {
	const context = useContext(NameManagementContext);
	if (!context) {
		throw new Error(
			"useNameManagementContext must be used within a NameManagementProvider",
		);
	}
	return context;
};

export const useNameManagementContextSafe = () => {
	return useContext(NameManagementContext);
};
