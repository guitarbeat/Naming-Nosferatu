import type { DashboardTab, NameFilter } from "./types";

export const ADMIN_TABS: readonly { value: DashboardTab; label: string }[] = [
	{ value: "overview", label: "Overview" },
	{ value: "names", label: "Names" },
	{ value: "users", label: "Users" },
	{ value: "analytics", label: "Analytics" },
];

export const FILTER_OPTIONS: readonly { value: NameFilter; label: string }[] = [
	{ value: "all", label: "All Names" },
	{ value: "active", label: "Active" },
	{ value: "hidden", label: "Hidden" },
	{ value: "locked", label: "Locked In" },
];
