import { lazy, Suspense } from "react";
import { useAuth } from "@/app/providers/Providers";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { MagicToggle } from "@/shared/components/ui/MagicToggle";
import useAppStore from "@/store/appStore";

const LazyProfileInner = lazy(() =>
	import("@/shared/components/profile/ProfileInner").then((module) => ({
		default: module.ProfileInner,
	})),
);

const LazyNameSuggestion = lazy(() =>
	import("@/features/tournament/components/NameSuggestion").then((module) => ({
		default: module.NameSuggestion,
	})),
);

type ActionTab = "suggest" | "profile" | null;

export function HomeActions() {
	const _user = useAppStore((s) => s.user);
	const { login, logout } = useAuth();
	const activeTab = useAppStore((s) => s.homeActionsTab || null);
	const setActiveTab = useAppStore(
		(s) =>
			s.setHomeActionsTab ||
			(() => {
				/* default */
			}),
	);

	const handleLogin = async (name: string) => {
		await login({ name });
		setActiveTab(null);
		return true;
	};

	return (
		<div className="w-full max-w-2xl mx-auto mt-8 flex flex-col items-center gap-6">
			<MagicToggle
				options={[
					{ value: "suggest", label: "Suggest a Name" },
					{ value: "profile", label: "Profile & Settings" },
				]}
				value={activeTab as string}
				onChange={(val) => setActiveTab(activeTab === val ? null : (val as ActionTab))}
			/>

			{activeTab === "suggest" && (
				<div className="w-full bg-foreground/5 backdrop-blur-md border border-border/10 rounded-2xl p-6 shadow-xl motion-safe:animate-[fadeIn_220ms_ease-out]">
					<Suspense fallback={<Loading variant="skeleton" height={200} />}>
						<LazyNameSuggestion variant="inline" onClose={() => setActiveTab(null)} />
					</Suspense>
				</div>
			)}

			{activeTab === "profile" && (
				<div className="w-full bg-foreground/5 backdrop-blur-md border border-border/10 rounded-2xl p-6 shadow-xl motion-safe:animate-[fadeIn_220ms_ease-out]">
					<Suspense fallback={<Loading variant="skeleton" height={200} />}>
						<LazyProfileInner onLogin={handleLogin} onLogout={logout} />
					</Suspense>
				</div>
			)}
		</div>
	);
}
