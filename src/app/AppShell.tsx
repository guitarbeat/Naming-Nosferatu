import { type ComponentType, lazy, Suspense, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { Loading } from "@/shared/components/layout/Feedback/Loading";

const HomeRoute = lazy(() => import("@/app/routes/HomeRoute"));
const AdminRoute = lazy(() => import("@/app/routes/AdminRoute"));

function RouteFallback({ text }: { text: string }) {
	return <Loading variant="cat-gif" text={text} className="min-h-[82dvh]" />;
}

function SuspendedRoute({
	component: Component,
	fallbackText,
}: {
	component: ComponentType;
	fallbackText: string;
}) {
	return (
		<Suspense fallback={<RouteFallback text={fallbackText} />}>
			<Component />
		</Suspense>
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
						<SuspendedRoute
							component={HomeRoute}
							fallbackText="Loading home..."
						/>
					}
				/>
				<Route
					path="/tournament"
					element={<Navigate to="/" replace={true} />}
				/>
				<Route path="/analysis" element={<Navigate to="/" replace={true} />} />
				<Route
					path="/admin"
					element={
						<SuspendedRoute
							component={AdminRoute}
							fallbackText="Loading admin..."
						/>
					}
				/>
			</Routes>
		</AppLayout>
	);
}
