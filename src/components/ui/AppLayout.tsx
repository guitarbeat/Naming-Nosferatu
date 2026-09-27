import type React from "react";
import {
	ErrorBoundary,
	ErrorComponent,
	Iridescence,
	Loading,
	OfflineIndicator,
	PwaInstallPrompt,
} from "@/components";
import useAppStore from "@/store";

const IRIDESCENCE_COLOR: [number, number, number] = [1, 1, 1];

function GlobalOverlays() {
	const handleSkipToMain = () => {
		const main = document.getElementById("main-content");
		if (!main) {
			return;
		}
		main.focus();
		main.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<>
			<PwaInstallPrompt />
			<OfflineIndicator />
			<button
				type="button"
				className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:p-4 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-lg focus:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring focus:ring-offset-background cursor-pointer disabled:cursor-not-allowed"
				onClick={handleSkipToMain}
			>
				Skip to main content
			</button>
		</>
	);
}

export function AppLayout({ children }: { children: React.ReactNode }) {
	const isLoading = useAppStore((s) => s.tournament.isLoading);
	const currentError = useAppStore((s) => s.errors.current);
	const errorActions = useAppStore((s) => s.errorActions);

	const handleDismissError = () => {
		errorActions.clearError();
	};

	return (
		<ErrorBoundary context="Main Application Layout">
			<div className="app relative min-h-dvh w-full bg-background text-foreground overflow-x-hidden">
				<Iridescence
					color={IRIDESCENCE_COLOR}
					speed={0.8}
					amplitude={0.08}
					mouseReact={true}
					className="fixed inset-0 z-0 opacity-100 pointer-events-none"
				/>
				<GlobalOverlays />
				<main
					id="main-content"
					className="app-main relative z-10 flex w-full flex-col pt-0"
					tabIndex={-1}
				>
					{Boolean(currentError) && (
						<div className="mx-auto mb-4 w-full max-w-4xl px-3 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
							<ErrorComponent error={String(currentError)} onDismiss={handleDismissError} />
						</div>
					)}
					<div className="app-main__content flex w-full flex-1 flex-col items-stretch">
						{children}
					</div>
					{isLoading && (
						<div
							className="global-loading-overlay"
							role="status"
							aria-live="polite"
							aria-busy="true"
						>
							<Loading variant="spinner" text="Initializing Tournament..." />
						</div>
					)}
				</main>
			</div>
		</ErrorBoundary>
	);
}
