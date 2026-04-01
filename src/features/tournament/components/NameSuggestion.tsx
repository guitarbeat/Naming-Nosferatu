/**
 * @module NameSuggestion
 * @description Unified name suggestion component with inline and modal variants.
 * Uses the shared useNameSuggestion hook for consistent submission logic.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useRef } from "react";
import { Button, Input, LiquidGlass, Textarea } from "@/shared/components/layout";
import { getGlassPreset } from "@/shared/components/layout/GlassPresets";
import { useNameSuggestion } from "@/shared/hooks";
import { CheckCircle, Lightbulb, X } from "@/shared/lib/icons";

// ============================================================================
// TYPES
// ============================================================================

interface NameSuggestionProps {
        /** Variant: inline (compact) or modal (full-featured) */
        variant?: "inline" | "modal";
        /** For modal variant: controls visibility */
        isOpen?: boolean;
        /** For modal variant: close callback */
        onClose?: () => void;
}

// ============================================================================
// INNER CONTENT (no wrapper — used when embedded in a shared container)
// ============================================================================

export function NameSuggestionInner() {
	const { values, isSubmitting, handleChange, handleSubmit, globalError, successMessage } =
		useNameSuggestion();

	const handleLocalSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await handleSubmit();
	};

	const isFormComplete = values.name.trim().length > 0 && values.description.trim().length > 0;

	return (
		<form onSubmit={handleLocalSubmit} className="w-full max-w-2xl mx-auto">
			<div className="rounded-2xl border border-border/20 bg-card/60 backdrop-blur-xl p-5 sm:p-8 space-y-6">
				{/* Header */}
				<div className="text-center space-y-2">
					<div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
						<Lightbulb size={16} className="text-primary" />
						<span className="text-xs font-bold uppercase tracking-widest text-primary">
							Pitch a Name
						</span>
					</div>
					<h2 className="text-xl sm:text-3xl font-black text-foreground">
						What would you name him?
					</h2>
					<p className="text-sm text-muted-foreground">
						Every suggestion enters the bracket for voting.
					</p>
				</div>

				{/* Fields */}
				<div className="space-y-4">
					<div className="space-y-1.5">
						<label
							htmlFor="suggest-name"
							className="flex items-center gap-2 text-sm font-semibold text-foreground/90"
						>
							<span className="w-1.5 h-1.5 bg-primary rounded-full" />
							Name
							<span className="text-destructive text-xs">*</span>
							<span className="text-xs text-muted-foreground/60 ml-auto tabular-nums">
								{values.name.length}/50
							</span>
						</label>
						<Input
							id="suggest-name"
							type="text"
							value={values.name}
							onChange={(e) => handleChange("name", e.target.value)}
							placeholder="e.g. Count Whiskula, Sir Paws-a-lot, Meow-zart"
							className="h-12 text-base font-medium"
							disabled={isSubmitting}
							maxLength={50}
						/>
					</div>

					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<label
								htmlFor="suggest-description"
								className="flex items-center gap-2 text-sm font-semibold text-foreground/90"
							>
								<span className="w-1.5 h-1.5 bg-accent rounded-full" />
								Why this name?
								<span className="text-destructive text-xs">*</span>
							</label>
							<span className="text-xs text-muted-foreground/60 tabular-nums">
								{values.description.length}/500
							</span>
						</div>
						<Textarea
							id="suggest-description"
							value={values.description}
							onChange={(e) => handleChange("description", e.target.value)}
							placeholder="What makes it special? Help voters feel the vibe."
							rows={3}
							className="text-base resize-none"
							disabled={isSubmitting}
							maxLength={500}
							showCount={false}
						/>
					</div>
				</div>

				{/* Submit */}
				<div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
					<p className="text-xs text-muted-foreground hidden sm:block">
						Goes into the shared pool for everyone to discover
					</p>
					<Button
						type="submit"
						variant="glass"
						disabled={!isFormComplete || isSubmitting}
						loading={isSubmitting}
						className="w-full sm:w-auto px-6 py-3 font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground border border-primary/30"
					>
						{isSubmitting ? "Submitting…" : "Submit"}
					</Button>
				</div>

				{/* Status Messages */}
				<AnimatePresence mode="wait">
					{globalError && (
						<motion.div
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-sm font-medium text-center flex items-center justify-center gap-2"
						>
							<X size={14} className="text-destructive shrink-0" />
							{globalError}
						</motion.div>
					)}
					{successMessage && (
						<motion.div
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							className="p-3 rounded-xl border border-chart-2/30 bg-chart-2/10 text-sm font-medium text-center flex items-center justify-center gap-2 text-chart-2"
						>
							<CheckCircle size={14} className="shrink-0" />
							{successMessage}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</form>
	);
}

// ============================================================================
// INLINE VARIANT (self-contained with LiquidGlass wrapper)
// ============================================================================

function InlineNameSuggestion() {
        return <NameSuggestionInner />;
}

// ============================================================================
// MODAL VARIANT
// ============================================================================

interface ModalNameSuggestionProps {
        isOpen: boolean;
        onClose: () => void;
}

function ModalNameSuggestion({ isOpen, onClose }: ModalNameSuggestionProps) {
        const isMountedRef = useRef(true);
        const nameInputRef = useRef<HTMLInputElement | null>(null);
        const modalGlassId = useId();

        const {
                values,
                errors,
                touched,
                isSubmitting,
                isValid,
                handleChange,
                handleBlur,
                handleSubmit,
                reset,
                globalError,
                successMessage: success,
                setGlobalError,
        } = useNameSuggestion({
                onSuccess: () => {
                        setTimeout(() => {
                                if (isMountedRef.current) {
                                        onClose();
                                }
                        }, 3000);
                },
        });

        useEffect(() => {
                isMountedRef.current = true;
                return () => {
                        isMountedRef.current = false;
                };
        }, []);

        useEffect(() => {
                if (isOpen && nameInputRef.current) {
                        setTimeout(() => {
                                nameInputRef.current?.focus();
                        }, 100);
                }
        }, [isOpen]);

        useEffect(() => {
                if (!isOpen) {
                        return;
                }

                const handleEscape = (e: KeyboardEvent) => {
                        if (e.key === "Escape") {
                                reset();
                                onClose();
                        }
                };

                window.addEventListener("keydown", handleEscape);
                return () => window.removeEventListener("keydown", handleEscape);
        }, [isOpen, onClose, reset]);

        const handleClose = useCallback(() => {
                if (isSubmitting) {
                        return;
                }
                reset();
                setGlobalError("");
                onClose();
        }, [isSubmitting, onClose, reset, setGlobalError]);

        if (!isOpen) {
                return null;
        }

        return (
                <>
                        <div
                                className="fixed inset-0 bg-black/60 z-[1050] backdrop-blur-sm animate-in fade-in duration-200"
                                onClick={handleClose}
                                aria-hidden="true"
                        />
                        <LiquidGlass
                                id={`modal-glass-${modalGlassId.replace(/:/g, "-")}`}
                                {...getGlassPreset("modal")}
                                className="z-[1051] overflow-hidden"
                                style={{
                                        position: "fixed",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        width: "min(90vw, 500px)",
                                        maxHeight: "90vh",
                                        height: "auto",
                                        minHeight: "400px",
                                        maxWidth: "min(90vw, 500px)",
                                        zIndex: "1051",
                                }}
                        >
                                <div
                                        className="flex flex-col h-full bg-black/40 text-white"
                                        role="dialog"
                                        aria-labelledby="suggest-name-title"
                                        aria-describedby="suggest-name-description"
                                        aria-modal="true"
                                >
                                        <div className="flex items-center justify-between p-6 border-b border-border bg-foreground/5">
                                                <h2
                                                        id="suggest-name-title"
                                                        className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent"
                                                >
                                                        💡 Suggest a Name
                                                </h2>
                                                <button
                                                        type="button"
                                                        className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
                                                        onClick={handleClose}
                                                        aria-label="Close modal"
                                                        disabled={isSubmitting}
                                                >
                                                        <X size={24} />
                                                </button>
                                        </div>

                                        <div className="p-6">
                                                <p id="suggest-name-description" className="text-sm text-muted-foreground mb-6">
                                                        Help us expand the list by suggesting new cat names!
                                                </p>

                                                <form
                                                        onSubmit={(e) => {
                                                                e.preventDefault();
                                                                void handleSubmit();
                                                        }}
                                                        className="flex flex-col gap-5"
                                                >
                                                        <Input
                                                                id="modal-name-input"
                                                                label="Name"
                                                                ref={nameInputRef}
                                                                type="text"
                                                                value={values.name}
                                                                onChange={(e) => {
                                                                        handleChange("name", e.target.value);
                                                                        if (globalError) {
                                                                                setGlobalError("");
                                                                        }
                                                                }}
                                                                onBlur={() => handleBlur("name")}
                                                                placeholder="e.g., Whiskers"
                                                                maxLength={50}
                                                                showSuccess={true}
                                                                error={touched.name ? errors.name : null}
                                                        />

                                                        <Textarea
                                                                id="modal-description-input"
                                                                label="Description"
                                                                value={values.description}
                                                                onChange={(e) => {
                                                                        handleChange("description", e.target.value);
                                                                        if (globalError) {
                                                                                setGlobalError("");
                                                                        }
                                                                }}
                                                                onBlur={() => handleBlur("description")}
                                                                placeholder="Why is this name special? (e.g. 'He looks like a vampire!')"
                                                                disabled={isSubmitting}
                                                                maxLength={500}
                                                                rows={4}
                                                                error={touched.description ? errors.description : null}
                                                                showCount={true}
                                                        />

                                                        {globalError && (
                                                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive-foreground text-sm font-medium animate-in fade-in slide-in-from-top-2">
                                                                        {globalError}
                                                                </div>
                                                        )}
                                                        {success && (
                                                                <div className="p-3 bg-chart-2/10 border border-chart-2/20 rounded-lg text-chart-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                                                                        {success}
                                                                </div>
                                                        )}

                                                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                                                                <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                                                                        Cancel
                                                                </Button>
                                                                <Button
                                                                        type="submit"
                                                                        variant="glass"
                                                                        disabled={isSubmitting || !isValid}
                                                                        loading={isSubmitting}
                                                                        className="px-6"
                                                                >
                                                                        Submit Suggestion
                                                                </Button>
                                                        </div>
                                                </form>
                                        </div>
                                </div>
                        </LiquidGlass>
                </>
        );
}

// ============================================================================
// UNIFIED EXPORT
// ============================================================================

export function NameSuggestion({
        variant = "inline",
        isOpen = false,
        onClose,
}: NameSuggestionProps) {
        if (variant === "modal") {
                return (
                        <ModalNameSuggestion
                                isOpen={isOpen}
                                onClose={
                                        onClose ||
                                        (() => {
                                                /* No-op default */
                                        })
                                }
                        />
                );
        }
        return <InlineNameSuggestion />;
}
