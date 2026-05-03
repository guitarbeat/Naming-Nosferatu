import { lazy, Suspense, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { Loading } from "@/shared/components/layout/Feedback";

const HomeRoute = lazy(() => import("@/app/routes/HomeRoute"));
const AdminRoute = lazy(() => import("@/app/routes/AdminRoute"));

function RouteFallback({ text }: { text: string }) {
        return (
                <div className="flex min-h-[82dvh] w-full flex-col items-center justify-center gap-5 px-4 text-center">
                        <img
                                src="/assets/images/cat.gif"
                                alt=""
                                aria-hidden="true"
                                className="h-16 w-16 select-none object-contain opacity-75"
                        />
                        <div className="flex flex-col items-center gap-3">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/40">
                                        My cat's name is
                                </p>
                                <div className="h-px w-10 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                        </div>
                        <div className="flex flex-col items-center gap-2" role="status">
                                <div className="relative h-5 w-5" aria-hidden="true">
                                        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                                        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary/50" />
                                </div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/35">
                                        {text}
                                </p>
                        </div>
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
