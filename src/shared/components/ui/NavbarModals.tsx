import { lazy, Suspense } from "react";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { Modal } from "@/shared/components/layout/Modal";

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

interface NavbarModalsProps {
	isProfileOpen: boolean;
	isSuggestOpen: boolean;
	onProfileClose: () => void;
	onSuggestClose: () => void;
	profileOriginRect: { x: number; y: number; width: number; height: number } | null;
	suggestOriginRect: { x: number; y: number; width: number; height: number } | null;
	onLogin: (name: string) => Promise<boolean | undefined>;
	onLogout: () => void;
}

export function NavbarModals({
	isProfileOpen,
	isSuggestOpen,
	onProfileClose,
	onSuggestClose,
	profileOriginRect,
	suggestOriginRect,
	onLogin,
	onLogout,
}: NavbarModalsProps) {
	return (
		<>
			{isProfileOpen && (
				<Modal
					title="Your Profile"
					hideTitle={true}
					open={isProfileOpen}
					onClose={onProfileClose}
					maxWidth="max-w-md"
					description="Sign in to save your rankings."
					originRect={profileOriginRect}
				>
					<Suspense fallback={<Loading variant="card-skeleton" height={260} />}>
						<LazyProfileInner onLogin={onLogin} onLogout={onLogout} />
					</Suspense>
				</Modal>
			)}
			{isSuggestOpen && (
				<Modal
					title="Suggest a Name"
					hideTitle={true}
					open={isSuggestOpen}
					onClose={onSuggestClose}
					maxWidth="max-w-md"
					description="Suggest a cat name."
					originRect={suggestOriginRect}
				>
					<Suspense fallback={<Loading variant="card-skeleton" height={260} />}>
						<LazyNameSuggestion variant="modal" onClose={onSuggestClose} />
					</Suspense>
				</Modal>
			)}
		</>
	);
}
