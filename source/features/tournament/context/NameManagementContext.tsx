import { createContext, useContext } from "react";
import type { UseNameManagementViewResult } from "@/types/appTypes";

export const NameManagementContext = createContext<UseNameManagementViewResult | null>(null);

export function NameManagementProvider({
	children,
	value,
}: {
	children: React.ReactNode;
	value: UseNameManagementViewResult;
}) {
	return <NameManagementContext.Provider value={value}>{children}</NameManagementContext.Provider>;
}

export function useNameManagementContextOptional(): UseNameManagementViewResult | null {
	const context = useContext(NameManagementContext);
	return context;
}

export function useNameManagementContextSafe(): UseNameManagementViewResult {
	const context = useContext(NameManagementContext);
	if (!context) {
		throw new Error("useNameManagementContext must be used within a NameManagementProvider");
	}
	return context;
}
