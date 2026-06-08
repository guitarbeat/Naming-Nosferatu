import { lazy, Suspense } from "react";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { Modal } from "@/shared/components/layout/Modal";
import {
	DynamicIslandNav,
	type DynamicIslandNavItem,
} from "@/shared/components/ui/dynamic-island-nav";
import { cn } from "@/shared/lib/utils";
import { useFloatingNavbarState } from "./useFloatingNavbarState";

function MobileBottomNav({
	items,
	isVisible,
}: {
	items: DynamicIslandNavItem[];
	isVisible: boolean;
}) {
	const topItems = items.filter((i) => i.level === 1).slice(0, 5);

	return (
		<nav
			className={cn(
				"fixed bottom-0 left-0 w-full z-[9998] flex items-center justify-around border-t border-border/50 bg-background/95 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-lg transition-transform duration-300 sm:hidden",
				isVisible ? "translate-y-0" : "translate-y-full",
			)}
		>
			{topItems.map((item) => {
				const isActive = Boolean(item.isActive);
				return (
					<button
						key={item.id}
						type="button"
						onClick={item.onClick}
						className={cn(
							"flex flex-col items-center justify-center gap-1 px-2 py-1 min-h-[48px] min-w-[48px]",
							item.isAccent && !isActive && "text-primary",
							item.isAccent && isActive && "text-primary",
							!item.isAccent && isActive && "text-foreground",
							!isActive && !item.isAccent && "text-muted-foreground",
						)}
						aria-label={item.ariaLabel ?? item.label}
						aria-current={isActive ? "location" : undefined}
					>
						<span className="relative flex shrink-0 items-center justify-center">
							{item.icon}
							{item.hasBadge && (
								<span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
							)}
						</span>
						<span className="text-xs font-medium tracking-tight">{item.label}</span>
					</button>
				);
			})}
		</nav>
	);
}

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

export function FloatingNavbar() {
	const {
		isTournamentRoute,
		shouldShow,
		profileButtonRef,
		suggestButtonRef,
		navItems,
		primaryLabel,
		activeSection,
		selectedCount,
		isTournamentActive,
		isAdminRoute,
		isHomeRoute,
		scrollProgress,
		prefersReducedMotion,
		isProfileOpen,
		setIsProfileOpen,
		profileOriginRect,
		isSuggestOpen,
		setIsSuggestOpen,
		suggestOriginRect,
		login,
		logout,
	} = useFloatingNavbarState();

	if (isTournamentRoute) {
		return null;
	}

	return (
		<>
			<div ref={profileButtonRef} className="sr-only" aria-hidden="true" />
			<div ref={suggestButtonRef} className="sr-only" aria-hidden="true" />

			<div className="hidden sm:block">
				<DynamicIslandNav
					items={navItems}
					collapsedLabel={primaryLabel}
					collapsedLabelKey={
						isAdminRoute
							? "admin"
							: isHomeRoute
								? `${activeSection}-${selectedCount}-${isTournamentActive}`
								: "away"
					}
					progress={scrollProgress}
					isVisible={shouldShow}
					prefersReducedMotion={prefersReducedMotion}
				/>
			</div>

			<MobileBottomNav items={navItems} isVisible={shouldShow} />

			{isProfileOpen && (
				<Modal
					title="Your Profile"
					hideTitle={true}
					open={isProfileOpen}
					onClose={() => setIsProfileOpen(false)}
					maxWidth="max-w-md"
					description="Sign in to save your rankings."
					originRect={profileOriginRect}
				>
					<Suspense fallback={<Loading variant="card-skeleton" height={260} />}>
						<LazyProfileInner
							onLogin={async (name) => {
								const ok = await login({ name });
								if (ok !== false) {
									setIsProfileOpen(false);
								}
								return ok;
							}}
							onLogout={logout}
						/>
					</Suspense>
				</Modal>
			)}
			{isSuggestOpen && (
				<Modal
					title="Suggest a Name"
					hideTitle={true}
					open={isSuggestOpen}
					onClose={() => setIsSuggestOpen(false)}
					maxWidth="max-w-md"
					description="Suggest a cat name."
					originRect={suggestOriginRect}
				>
					<Suspense fallback={<Loading variant="card-skeleton" height={260} />}>
						<LazyNameSuggestion variant="modal" onClose={() => setIsSuggestOpen(false)} />
					</Suspense>
				</Modal>
			)}
		</>
	);
}
