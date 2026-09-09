import { memo } from "react";
import { Loading } from "@/components/LayoutBlocks";
import { useAdminDashboard } from "./hooks";
import type { DashboardProps } from "./types";

function AdminDashboard() {
	const { isLoading, filteredNames } = useAdminDashboard();

	if (isLoading) {
		return <Loading />;
	}

	return (
		<div className="p-4 bg-card rounded-xl">Admin Dashboard: {filteredNames.length} names</div>
	);
}

interface UnifiedDashboardProps extends DashboardProps {
	isAdmin?: boolean;
}

// ⚡ Bolt Performance Optimization: Wrapped Dashboard in React.memo()
export const Dashboard = memo(function Dashboard(props: UnifiedDashboardProps) {
	if (!props.isAdmin) {
		return null;
	}

	return (
		<div className="w-full space-y-6">
			<AdminDashboard />
		</div>
	);
});
