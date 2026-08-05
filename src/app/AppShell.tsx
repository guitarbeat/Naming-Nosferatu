import { lazy, Suspense, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { Loading } from "@/shared/components/layout/Feedback/Loading";

const HomeRoute = lazy(() => import("@/app/routes/HomeRoute"));
const AdminRoute = lazy(() => import("@/app/routes/AdminRoute"));

function RouteFallback({ text }: { text: string }) {
	return <Loading variant="cat-gif" text={text} className="min-h-[82dvh]" />;
}

function Suspended({
	children,
	text,
}: {
	children: React.ReactNode;
	text: string;
}) {
	return (
		<Suspense fallback={<RouteFallback text={text} />}>{children}</Suspense>
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
						<Suspended text="Loading home...">
							<HomeRoute />
						</Suspended>
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
						<Suspended text="Loading admin...">
							<AdminRoute />
						</Suspended>
					}
				/>
			</Routes>
		</AppLayout>
	);
}
