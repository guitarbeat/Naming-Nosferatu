import {
	BarChart3,
	CheckCircle,
	Lightbulb,
	Lock,
	Trophy,
	User,
} from "lucide-react";
import {
	lazy,
	memo,
	type ReactNode,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/Providers";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { Modal } from "@/shared/components/layout/Modal";
import {
	hapticNavTap,
	hapticTournamentStart,
} from "@/shared/lib/browser/haptics";
import { cn } from "@/shared/lib/utils";
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

import { FloatingNav, type NavItem } from "@/shared/components/ui/FloatingNav";
import { type NavSection, useNavScroll } from "./hooks/useNavScroll";

export function FloatingNavbar() {
	const tournament = useAppStore((s) => s.tournament);
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const user = useAppStore((s) => s.user);
	const navigate = useNavigate();
	const location = useLocation();
	const { login, logout } = useAuth();
	const { selectedNames } = tournament;
	const { isLoggedIn, name: userName, avatarUrl, isAdmin } = user;

	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isSuggestOpen, setIsSuggestOpen] = useState(false);

	const isHomeRoute = location.pathname === "/";
	const isAdminRoute = location.pathname === "/admin";
	const isTournamentRoute = location.pathname === "/tournament";

	const { activeSection, setPendingScroll, scrollToSection } =
		useNavScroll(isHomeRoute);

	const selectedCount = selectedNames?.length || 0;
	const isTournamentActive = Boolean(tournament.names);
	const profileLabel = isLoggedIn
		? userName?.split(" ")[0] || "Profile"
		: "Profile";

	const handleStartTournament = useCallback(() => {
		hapticTournamentStart();
		if (selectedNames && selectedNames.length >= 2) {
			tournamentActions.setNames(selectedNames);
			if (isHomeRoute) {
				scrollToSection("tournament");
			} else {
				setPendingScroll("tournament");
				navigate("/");
			}
		}
	}, [
		isHomeRoute,
		navigate,
		scrollToSection,
		selectedNames,
		tournamentActions,
		setPendingScroll,
	]);

	const handleNavClick = useCallback(
		(key: NavSection) => {
			hapticNavTap();
			if (!isHomeRoute) {
				setPendingScroll(key);
				navigate("/");
				return;
			}
			scrollToSection(key);
		},
		[isHomeRoute, navigate, scrollToSection, setPendingScroll],
	);

	const handleAdminClick = useCallback(() => {
		hapticNavTap();
		if (!isAdminRoute) {
			navigate("/admin");
		}
	}, [isAdminRoute, navigate]);

	const openProfileModal = useCallback(() => {
		hapticNavTap();
		setIsProfileOpen(true);
	}, []);

	const openSuggestModal = useCallback(() => {
		hapticNavTap();
		setIsSuggestOpen(true);
	}, []);

	const navItems = useMemo((): NavItem[] => {
		const items: NavItem[] = [];

		if (isHomeRoute) {
			items.push({
				id: "pick",
				label: isTournamentActive
					? "Compare"
					: selectedCount >= 2
						? `Vote (${selectedCount})`
						: "Favorites",
				icon: isTournamentActive ? (
					<Trophy className="h-4 w-4" />
				) : selectedCount >= 2 ? (
					<Trophy className="h-4 w-4" />
				) : (
					<CheckCircle className="h-4 w-4" />
				),
				isActive: activeSection === "pick" || activeSection === "tournament",
				isAccent: isTournamentActive || selectedCount >= 2,
				onClick: () => {
					if (isTournamentActive) {
						handleNavClick("tournament");
					} else if (selectedCount >= 2) {
						handleStartTournament();
					} else {
						handleNavClick("pick");
					}
				},
			});

			items.push({
				id: "analysis",
				label: "Results",
				icon: <BarChart3 className="h-4 w-4" />,
				isActive: activeSection === "analysis",
				hasBadge:
					Object.keys(tournament.ratings).length > 0 &&
					activeSection !== "analysis",
				onClick: () => handleNavClick("analysis"),
			});
		}

		items.push({
			id: "suggest",
			label: "Suggest",
			icon: <Lightbulb className="h-4 w-4" />,
			isActive: isSuggestOpen,
			onClick: openSuggestModal,
		});

		if (isAdmin) {
			items.push({
				id: "admin",
				label: "Admin",
				icon: <Lock className="h-4 w-4" />,
				isActive: isAdminRoute,
				onClick: handleAdminClick,
			});
		}

		items.push({
			id: "profile",
			label: profileLabel,
			icon:
				isLoggedIn && avatarUrl ? (
					<img
						src={avatarUrl}
						alt={profileLabel}
						className="h-5 w-5 rounded-full border border-foreground/15 object-cover"
					/>
				) : (
					<User
						className={cn(
							"h-4 w-4",
							isLoggedIn && isAdmin && "text-chart-4",
							isLoggedIn && !isAdmin && "text-primary",
						)}
					/>
				),
			isActive: isProfileOpen,
			onClick: openProfileModal,
		});

		return items;
	}, [
		activeSection,
		avatarUrl,
		handleAdminClick,
		handleNavClick,
		handleStartTournament,
		isAdmin,
		isAdminRoute,
		isHomeRoute,
		isLoggedIn,
		isProfileOpen,
		isSuggestOpen,
		isTournamentActive,
		openProfileModal,
		openSuggestModal,
		profileLabel,
		selectedCount,
		tournament.ratings,
	]);

	if (isTournamentRoute) {
		return null;
	}

	return (
		<>
			<FloatingNav items={navItems} />

			{isProfileOpen && (
				<Modal
					title="Your Profile"
					hideTitle={true}
					open={isProfileOpen}
					onClose={() => setIsProfileOpen(false)}
					description="Sign in to save your rankings."
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
					description="Suggest a cat name."
				>
					<Suspense fallback={<Loading variant="card-skeleton" height={260} />}>
						<LazyNameSuggestion
							variant="modal"
							onClose={() => setIsSuggestOpen(false)}
						/>
					</Suspense>
				</Modal>
			)}
		</>
	);
}
