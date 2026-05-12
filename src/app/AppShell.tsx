import { lazy, Suspense, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { Loading } from "@/shared/components/layout/Feedback";

const HomeRoute = lazy(() => import("@/app/routes/HomeRoute"));
const AdminRoute = lazy(() => import("@/app/routes/AdminRoute"));

function RouteFallback({ text }: { text: string }) {
	return (
		<div className="mx-auto flex min-h-[40vh] w-full max-w-4xl items-center justify-center px-4">
			<Loading variant="spinner" text={text} />
		</div>
	);
}

export default function AppShell() {
	const { pathname } = useLocation();

	useLayoutEffect(() => {
		if (pathname) {
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}
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
