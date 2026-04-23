import React, { useEffect, useRef } from "react";
import { X } from "@/shared/lib/icons";

interface ModalProps {
        title: string;
        isOpen?: boolean;
        onClose: () => void;
        children: React.ReactNode;
        maxWidth?: "max-w-sm" | "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl";
        closeDisabled?: boolean;
        description?: string;
        hideTitle?: boolean;
}

export function Modal({
        title,
        isOpen = true,
        onClose,
        children,
        maxWidth = "max-w-md",
        closeDisabled = false,
        description,
        hideTitle = false,
}: ModalProps) {
        const modalRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
                if (!isOpen) {
                        return;
                }

                const modalElement = modalRef.current;
                if (!modalElement) {
                        return;
                }

                const previouslyFocusedElement =
                        document.activeElement instanceof HTMLElement ? document.activeElement : null;

                const getFocusableElements = () =>
                        Array.from(
                                modalElement.querySelectorAll<HTMLElement>(
                                        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
                                ),
                        );

                const focusFirstElement = () => {
                        const [firstElement] = getFocusableElements();
                        if (firstElement) {
                                firstElement.focus();
                                return;
                        }
                        modalElement.focus();
                };

                const handleKeyDown = (e: KeyboardEvent) => {
                        if (e.key === "Escape" && !closeDisabled) {
                                e.preventDefault();
                                onClose();
                                return;
                        }

                        if (e.key !== "Tab") {
                                return;
                        }

                        const focusableElements = getFocusableElements();
                        if (focusableElements.length === 0) {
                                e.preventDefault();
                                modalElement.focus();
                                return;
                        }

                        const firstElement = focusableElements[0];
                        const lastElement = focusableElements[focusableElements.length - 1];

                        if (e.shiftKey) {
                                if (document.activeElement === firstElement || document.activeElement === modalElement) {
                                        e.preventDefault();
                                        lastElement?.focus();
                                }
                                return;
                        }

                        if (document.activeElement === lastElement) {
                                e.preventDefault();
                                firstElement?.focus();
                        }
                };

                focusFirstElement();
                window.addEventListener("keydown", handleKeyDown);

                return () => {
                        window.removeEventListener("keydown", handleKeyDown);
                        if (previouslyFocusedElement?.isConnected) {
                                previouslyFocusedElement.focus();
                        }
                };
        }, [isOpen, onClose, closeDisabled]);

        if (!isOpen) {
                return null;
        }

        return (
                <div className="fixed inset-0 z-40 flex items-center justify-center px-4 pb-24 sm:pb-4 motion-safe:animate-[fadeIn_180ms_ease-out]">
                        <div
                                className="absolute inset-0 bg-background/60 backdrop-blur-sm"
                                onClick={() => {
                                        if (!closeDisabled) {
                                                onClose();
                                        }
                                }}
                                aria-hidden="true"
                        />

                        <div
                                ref={modalRef}
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="modal-title"
                                aria-describedby={description ? "modal-description" : undefined}
                                tabIndex={-1}
                                className={`glass-surface relative z-50 w-full ${maxWidth} overflow-hidden rounded-2xl border border-border/40 bg-card/85 backdrop-blur-xl p-5 sm:p-6 shadow-2xl motion-safe:animate-[surface-enter_220ms_var(--ease-out-expo)]`}
                        >
                                {/* Header */}
                                {hideTitle ? (
                                        <>
                                                <h2 id="modal-title" className="sr-only">
                                                        {title}
                                                </h2>
                                                <button
                                                        type="button"
                                                        onClick={onClose}
                                                        disabled={closeDisabled}
                                                        className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        aria-label={`Close ${title.toLowerCase()}`}
                                                >
                                                        <X className="size-4" />
                                                </button>
                                        </>
                                ) : (
                                        <div className="flex items-center justify-between mb-5">
                                                <h2 id="modal-title" className="text-base font-semibold text-foreground tracking-tight">
                                                        {title}
                                                </h2>
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
                                )}

                                {description && (
                                        <p id="modal-description" className="sr-only">
                                                {description}
                                        </p>
                                )}

                                {children}
                        </div>
                </div>
        );
}
