import { createContext, useContext } from "react";
import type { UseNameManagementViewResult } from "@/types/appTypes";

const NameManagementContext = createContext<UseNameManagementViewResult | null>(
	null,
);

export function NameManagementProvider({
	children,
	value,
}: {
	children: React.ReactNode;
	value: UseNameManagementViewResult;
}) {
	return (
		<NameManagementContext.Provider value={value}>
			{children}
		</NameManagementContext.Provider>
	);
}

export function useNameManagementContextOptional(): UseNameManagementViewResult | null {
	const context = useContext(NameManagementContext);
	return context;
}
