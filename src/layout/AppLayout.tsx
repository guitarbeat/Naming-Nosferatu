/**
 * Stub: replace with your real AppLayout component.
 *
 * Wraps the application content with the global navbar, footer,
 * and any persistent UI chrome.
 */

import type { ReactNode } from "react";
import type { RatingData } from "@/types/appTypes";

interface AppLayoutProps {
	children: ReactNode;
	handleTournamentComplete: (ratings: Record<string, RatingData>) => void;
}

export function AppLayout({ children }: AppLayoutProps) {
	return (
		<div className="flex min-h-screen flex-col">
			{/* Navbar goes here */}
			<main className="flex-1">{children}</main>
			{/* Footer goes here */}
		</div>
	);
}
