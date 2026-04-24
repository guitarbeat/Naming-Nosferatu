import { Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { errorContexts, routeComponents } from "@/app/appConfig";
import { useAuth } from "@/app/providers/Providers";
import Button from "@/shared/components/layout/Button";
import { ErrorBoundary, Loading } from "@/shared/components/layout/Feedback";
import { Section } from "@/shared/components/layout/Section";

const AdminDashboardLazy = routeComponents.AdminDashboardLazy;

export default function AdminRoute() {
	const { user: authUser, isLoading: authLoading } = useAuth();
	const navigate = useNavigate();

	if (authLoading) {
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-background">
				<Loading variant="spinner" text="Checking access..." />
			</div>
		);
	}

	if (!authUser?.isAdmin) {
		return (
			<Section
				id="admin"
				variant="minimal"
				padding="comfortable"
				maxWidth="md"

			>
				<div className="flex flex-col items-center gap-4 py-10 text-center">
					<h2 className="text-3xl font-bold text-destructive">Access Denied</h2>
					<p className="max-w-md text-muted-foreground">
						Admin access is required to view this page. Head back home to log in
						or return to the main tournament flow.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-3">
						<Button variant="outline" onClick={() => navigate("/")}>
							Back Home
						</Button>
					</div>
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
