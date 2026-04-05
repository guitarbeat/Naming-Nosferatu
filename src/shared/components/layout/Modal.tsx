/**
 * @module Modal
 * @description Reusable modal dialog component with consistent styling and animations.
 * Handles overlay backdrop, glass panel, header with close button, and content.
 */

import React from "react";
import { X } from "@/shared/lib/icons";

interface ModalProps {
	/** Modal title displayed in header */
	title: string;
	/** Whether the modal is open */
	isOpen?: boolean;
	/** Callback when user requests to close (via backdrop or close button) */
	onClose: () => void;
	/** Modal content */
	children: React.ReactNode;
	/** Max width CSS class (default: max-w-md) */
	maxWidth?: "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl";
	/** Spacing between header and content (default: mb-4) */
	headerSpacing?: "mb-4" | "mb-6" | "mb-8";
	/** Whether close button is disabled */
	closeDisabled?: boolean;
}

/**
 * Reusable modal component with shared glass styling, animations, and accessibility.
 * Handles backdrop, panel, header, and content layout consistently.
 */
export function Modal({
	title,
	isOpen = true,
	onClose,
	children,
	maxWidth = "max-w-md",
	headerSpacing = "mb-4",
	closeDisabled = false,
}: ModalProps) {
	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-40 flex items-center justify-center px-4 pb-24 sm:pb-4 motion-safe:animate-[fadeIn_180ms_ease-out]">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-background/60 backdrop-blur-sm"
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Panel */}
			<div className={`glass-surface relative z-50 w-full ${maxWidth} overflow-hidden rounded-[calc(var(--glass-radius,1.5rem)+0.25rem)] border border-border/50 bg-card/80 p-6 shadow-2xl motion-safe:animate-[surface-enter_220ms_var(--ease-out-expo)]`}>
				{/* Header */}
				<div className={`flex items-center justify-between ${headerSpacing}`}>
					<h2 className="text-lg font-semibold text-foreground">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						disabled={closeDisabled}
						className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label={`Close ${title.toLowerCase()}`}
					>
						<X className="size-5" />
					</button>
				</div>

				{/* Content */}
				{children}
			</div>
		</div>
	);
}
