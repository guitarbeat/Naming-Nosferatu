import { memo } from "react";
import { Loading } from "@/components/LayoutBlocks";
import useAppStore from "@/store";

export const GlobalLoadingOverlay = memo(function GlobalLoadingOverlay() {
	const isLoading = useAppStore((s) => s.tournament.isLoading);

	if (!isLoading) {
		return null;
	}

	return (
		<div
			className="global-loading-overlay"
			role="status"
			aria-live="polite"
			aria-busy="true"
		>
			<Loading variant="spinner" text="Initializing Tournament..." />
		</div>
	);
});
