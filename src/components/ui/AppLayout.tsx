import type React from "react";
import {
	ErrorBoundary,
	GlobalErrorDisplay,
	GlobalLoadingOverlay,
	Iridescence,
	OfflineIndicator,
	PwaInstallPrompt,
	SkipToMainButton,
} from "@/components";

const IRIDESCENCE_COLOR: [number, number, number] = [1, 1, 1];

export function AppLayout({ children }: { children: React.ReactNode }) {
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
				<PwaInstallPrompt />
				<OfflineIndicator />
				<SkipToMainButton />

				<main
					id="main-content"
					className="app-main relative z-10 flex w-full flex-col pt-0"
					tabIndex={-1}
				>
					<GlobalErrorDisplay />
					<div className="app-main__content flex w-full flex-1 flex-col items-stretch">
						{children}
					</div>
					<GlobalLoadingOverlay />
				</main>
			</div>
		</ErrorBoundary>
	);
}
