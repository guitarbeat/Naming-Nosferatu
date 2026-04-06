/**
 * @module Modal
 * @description Reusable modal dialog component with consistent styling and animations.
 */

import React from "react";
import { X } from "@/shared/lib/icons";

interface ModalProps {
	title: string;
	isOpen?: boolean;
	onClose: () => void;
	children: React.ReactNode;
	maxWidth?: "max-w-sm" | "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl";
	closeDisabled?: boolean;
}

export function Modal({
	title,
	isOpen = true,
	onClose,
	children,
	maxWidth = "max-w-md",
	closeDisabled = false,
}: ModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-40 flex items-center justify-center px-4 pb-24 sm:pb-4 motion-safe:animate-[fadeIn_180ms_ease-out]">
			<div
				className="absolute inset-0 bg-background/60 backdrop-blur-sm"
				onClick={onClose}
				aria-hidden="true"
			/>

			<div className={`glass-surface relative z-50 w-full ${maxWidth} overflow-hidden rounded-2xl border border-border/40 bg-card/85 backdrop-blur-xl p-5 sm:p-6 shadow-2xl motion-safe:animate-[surface-enter_220ms_var(--ease-out-expo)]`}>
				{/* Header */}
				<div className="flex items-center justify-between mb-5">
					<h2 className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						disabled={closeDisabled}
						className="rounded-full p-1.5 text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label={`Close ${title.toLowerCase()}`}
					>
						<X className="size-4" />
					</button>
				</div>

				{children}
			</div>
		</div>
	);
}
