import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "@/shared/lib/icons";

interface OriginRect {
        x: number;
        y: number;
        width: number;
        height: number;
}

interface ModalProps {
        title: string;
        open?: boolean;
        onClose: () => void;
        children: React.ReactNode;
        maxWidth?: "max-w-sm" | "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl";
        closeDisabled?: boolean;
        description?: string;
        hideTitle?: boolean;
        originRect?: OriginRect | null;
}

const GENIE_DURATION_MS = 480;

export function Modal({
        title,
        open,
        onClose,
        children,
        maxWidth = "max-w-md",
        closeDisabled = false,
        description,
        hideTitle = false,
        originRect = null,
}: ModalProps) {
        const isOpenResolved = open ?? true;
        const modalRef = useRef<HTMLDivElement>(null);
        const [isClosing, setIsClosing] = useState(false);
        const [shouldRender, setShouldRender] = useState(isOpenResolved);
        const [genieVars, setGenieVars] = useState<React.CSSProperties | null>(null);

        useEffect(() => {
                if (isOpenResolved) {
                        setShouldRender(true);
                        setIsClosing(false);
                        return;
                }
                if (!shouldRender) {
                        return;
                }
                setIsClosing(true);
                const timer = window.setTimeout(() => {
                        setShouldRender(false);
                        setIsClosing(false);
                }, GENIE_DURATION_MS);
                return () => window.clearTimeout(timer);
        }, [isOpenResolved, shouldRender]);

        const requestClose = () => {
                if (closeDisabled) {
                        return;
                }
                onClose();
        };

        useLayoutEffect(() => {
                if (!shouldRender || !originRect || !modalRef.current) {
                        setGenieVars(null);
                        return;
                }
                const rect = modalRef.current.getBoundingClientRect();
                const modalCenterX = rect.left + rect.width / 2;
                const modalCenterY = rect.top + rect.height / 2;
                const originCenterX = originRect.x + originRect.width / 2;
                const originCenterY = originRect.y + originRect.height / 2;
                setGenieVars({
                        ["--genie-x" as never]: `${originCenterX - modalCenterX}px`,
                        ["--genie-y" as never]: `${originCenterY - modalCenterY}px`,
                });
        }, [shouldRender, originRect]);

        useEffect(() => {
                if (!isOpenResolved || isClosing) {
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
                                requestClose();
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
        }, [isOpenResolved, isClosing, onClose, closeDisabled]);

        if (!shouldRender) {
                return null;
        }

        const useGenie = Boolean(originRect);
        const surfaceAnimation = useGenie
                ? isClosing
                        ? "motion-safe:animate-[genie-out_460ms_cubic-bezier(0.7,0,0.84,0)_forwards]"
                        : "motion-safe:animate-[genie-in_460ms_cubic-bezier(0.16,1,0.3,1)_both]"
                : isClosing
                        ? "motion-safe:animate-[fadeIn_180ms_ease-out_reverse_forwards]"
                        : "motion-safe:animate-[surface-enter_220ms_var(--ease-out-expo)]";
        const overlayAnimation = isClosing
                ? "motion-safe:animate-[fadeIn_220ms_ease-out_reverse_forwards]"
                : "motion-safe:animate-[fadeIn_180ms_ease-out]";

        return (
                <div className={`fixed inset-0 z-40 flex items-center justify-center px-4 pb-24 sm:pb-4 ${overlayAnimation}`}>
                        <div
                                className="absolute inset-0 bg-background/60 backdrop-blur-sm"
                                onClick={() => {
                                        if (!closeDisabled) {
                                                requestClose();
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
                                style={genieVars ?? undefined}
                                className={`glass-surface relative z-50 w-full ${maxWidth} overflow-hidden rounded-2xl border border-border/40 bg-card/85 backdrop-blur-xl p-5 sm:p-6 shadow-2xl ${surfaceAnimation}`}
                        >
                                {/* Header */}
                                {hideTitle ? (
                                        <>
                                                <h2 id="modal-title" className="sr-only">
                                                        {title}
                                                </h2>
                                                <button
                                                        type="button"
                                                        onClick={requestClose}
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
                                                        onClick={requestClose}
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
