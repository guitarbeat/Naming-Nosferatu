import { MotionConfig } from "framer-motion";
import { Suspense, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "@/app/components/AppComponents";
import AdminRoute from "@/app/routes/AdminRoute";
import HomeRoute from "@/app/routes/HomeRoute";
import { RouteFallback } from "@/shared/components/UIBlocks";

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
		<MotionConfig reducedMotion="user">
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
		</MotionConfig>
	);
}
