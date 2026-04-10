import { Suspense } from "react";
import { errorContexts, routeComponents } from "@/app/appConfig";
import { useAuth } from "@/app/providers/Providers";
import { ErrorBoundary, Loading } from "@/shared/components/layout/Feedback";
import { Section } from "@/shared/components/layout/Section";

const AdminDashboardLazy = routeComponents.AdminDashboardLazy;

export default function AdminRoute() {
	const { user: authUser, isLoading: authLoading } = useAuth();

	if (authLoading) {
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-background">
				<Loading variant="spinner" text="Checking access..." />
			</div>
		);
	}

	if (!authUser?.isAdmin) {
		return (
			<Section id="admin" variant="minimal" padding="comfortable" maxWidth="md" centered={true}>
				<div className="flex flex-col items-center gap-4 py-10 text-center">
					<h2 className="text-3xl font-bold text-destructive">Access Denied</h2>
					<p className="text-muted-foreground">Admin access required to view this page.</p>
				</div>
			</Section>
		);
	}

	return (
		<Section id="admin" variant="minimal" padding="comfortable" maxWidth="2xl">
			<Suspense fallback={<Loading variant="skeleton" height={600} />}>
				<ErrorBoundary context={errorContexts.analysisDashboard}>
					<AdminDashboardLazy />
				</ErrorBoundary>
			</Suspense>
		</Section>
	);
}
