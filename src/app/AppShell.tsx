import { lazy, Suspense, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { Loading } from "@/shared/components/layout/Feedback/Loading";

const HomeRoute = lazy(() => import("@/app/routes/HomeRoute"));
const AdminRoute = lazy(() => import("@/app/routes/AdminRoute"));
const CinematicFooterDemo = lazy(() => import("@/shared/components/ui/cinematic-footer-demo"));
const CinematicHeroDemo = lazy(() => import("@/shared/components/ui/cinematic-landing-hero-demo"));

function RouteFallback({ text }: { text: string }) {
	return <Loading variant="cat-gif" text={text} className="min-h-[82dvh]" />;
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
				<Route
					path="/demo/cinematic-footer"
					element={
						<Suspense fallback={<RouteFallback text="Loading demo..." />}>
							<CinematicFooterDemo />
						</Suspense>
					}
				/>
				<Route
					path="/demo/cinematic-hero"
					element={
						<Suspense fallback={<RouteFallback text="Loading demo..." />}>
							<CinematicHeroDemo />
						</Suspense>
					}
				/>
			</Routes>
		</AppLayout>
	);
}
