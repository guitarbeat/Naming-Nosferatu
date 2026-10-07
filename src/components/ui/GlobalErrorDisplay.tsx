import { memo, useCallback } from "react";
import { ErrorComponent } from "@/components/LayoutBlocks";
import useAppStore from "@/store";

export const GlobalErrorDisplay = memo(function GlobalErrorDisplay() {
	const currentError = useAppStore((s) => s.errors.current);
	const errorActions = useAppStore((s) => s.errorActions);

	const handleDismissError = useCallback(() => {
		errorActions.clearError();
	}, [errorActions]);

	if (!currentError) {
		return null;
	}

	return (
		<div className="mx-auto mb-4 w-full max-w-4xl px-3 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
			<ErrorComponent
				error={String(currentError)}
				onDismiss={handleDismissError}
			/>
		</div>
	);
});
