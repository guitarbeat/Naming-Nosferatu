import type { DashboardTab, NameFilter } from "./types";

export const ADMIN_TABS: readonly { id: DashboardTab; label: string }[] = [
	{ id: "overview", label: "Overview" },
	{ id: "names", label: "Names" },
	{ id: "users", label: "Users" },
	{ id: "analytics", label: "Analytics" },
];

export const FILTER_OPTIONS: readonly { value: NameFilter; label: string }[] = [
	{ value: "all", label: "All Names" },
	{ value: "active", label: "Active" },
	{ value: "hidden", label: "Hidden" },
	{ value: "locked", label: "Locked In" },
];
