import { lazy, Suspense, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { RouteFallback } from "@/shared/components/ui/RouteFallback";

const HomeRoute = lazy(() => import("@/app/routes/HomeRoute"));
const AdminRoute = lazy(() => import("@/app/routes/AdminRoute"));

export default function AppShell() {
	const { pathname } = useLocation();

	useLayoutEffect(() => {
		if (!pathname) {
			return;
		}
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
	}, [pathname]);

	return (
		<AppLayout>
			<Routes>
				<Route
					path="/"
					element={
						<Suspense fallback={<RouteFallback text="Loading home..." />}>
							<HomeRoute />
						</Suspense>
					}
				/>
				<Route path="/tournament" element={<Navigate to="/" replace={true} />} />
				<Route path="/analysis" element={<Navigate to="/" replace={true} />} />
				<Route
					path="/admin"
					element={
						<Suspense fallback={<RouteFallback text="Loading admin..." />}>
							<AdminRoute />
						</Suspense>
					}
				/>
			</Routes>
		</AppLayout>
	);
}
