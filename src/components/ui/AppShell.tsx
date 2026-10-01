import { MotionConfig } from "framer-motion";
import { Suspense, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { RouteFallback } from "@/components";
import { AppLayout } from "./AppLayout";
import { HomeView } from "./HomeView";

export function AppShell() {
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
								<HomeView />
							</Suspense>
						}
					/>
					<Route path="/tournament" element={<Navigate to="/" replace={true} />} />
					<Route path="/analysis" element={<Navigate to="/" replace={true} />} />
					<Route path="/admin" element={<Navigate to="/" replace={true} />} />
					<Route path="*" element={<Navigate to="/" replace={true} />} />
				</Routes>
			</AppLayout>
		</MotionConfig>
	);
}
