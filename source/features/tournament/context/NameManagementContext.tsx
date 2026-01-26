import { createContext, useContext } from "react";
import type { UseNameManagementViewResult } from "@/types";

// Context Definition
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

/**
 * Optional version of useNameManagementContextSafe that returns null instead of throwing
 * when no provider is available. Useful for components that can work standalone.
 */
export function useNameManagementContextOptional(): UseNameManagementViewResult | null {
	const context = useContext(NameManagementContext);
	return context;
}
