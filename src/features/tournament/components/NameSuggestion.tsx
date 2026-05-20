import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";
import { useNameSuggestion } from "@/features/tournament/hooks/useNameSuggestion";
import Button from "@/shared/components/layout/Button";
import { Input, Textarea } from "@/shared/components/layout/FormPrimitives";
import { CheckCircle, X } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface NameSuggestionProps {
        variant?: "inline" | "modal";
        onClose?: () => void;
}

// ============================================================================
// STATUS MESSAGE
// ============================================================================

function StatusMessage({ error, success }: { error?: string; success?: string }) {
        return (
                <AnimatePresence mode="wait">
                        {error && (
                                <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className="p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-sm text-center flex items-center justify-center gap-2"
                                >
                                        <X size={14} className="text-destructive shrink-0" />
                                        {error}
                                </motion.div>
                        )}
                        {success && (
                                <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className="p-3 rounded-xl border border-chart-2/20 bg-chart-2/10 text-sm text-center flex items-center justify-center gap-2 text-chart-2"
                                >
                                        <CheckCircle size={14} className="shrink-0" />
                                        {success}
                                </motion.div>
                        )}
                </AnimatePresence>
        );
}

// ============================================================================
// INLINE INNER
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
                <form onSubmit={handleLocalSubmit} className="w-full max-w-2xl mx-auto space-y-7">
                        <div className="text-center space-y-3">
                                <h3 className="text-3xl sm:text-4xl font-black text-foreground uppercase tracking-tight">Have a suggestion?</h3>
                                <p className="text-base text-muted-foreground/80">
                                        Submit a name and it enters the bracket for everyone to vote on.
                                </p>
                        </div>

                        <div className="space-y-3">
                                <div className="flex items-baseline justify-between gap-4">
                                        <label htmlFor="suggest-name" className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">
                                                Name
                                        </label>
                                        <span className="text-xs text-muted-foreground/60 tabular-nums font-mono">
                                                {values.name.length}/50
                                        </span>
                                </div>
                                <Input
                                        id="suggest-name"
                                        type="text"
                                        value={values.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        placeholder="e.g. Count Whiskula, Sir Paws-a-lot"
                                        className="h-14 text-base font-medium border-primary/30 focus:border-primary/70 focus:bg-background/95 bg-background/80 rounded-2xl"
                                        disabled={isSubmitting}
                                        maxLength={50}
                                />
                        </div>

                        <div className="space-y-3">
                                <div className="flex items-baseline justify-between gap-4">
                                        <label htmlFor="suggest-description" className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">
                                                Why This Name?
                                        </label>
                                        <span className="text-xs text-muted-foreground/60 tabular-nums font-mono">
                                                {values.description.length}/500
                                        </span>
                                </div>
                                <Textarea
                                        id="suggest-description"
                                        value={values.description}
                                        onChange={(e) => handleChange("description", e.target.value)}
                                        placeholder="What makes it special? Help voters feel the vibe."
                                        rows={4}
                                        className="text-base font-medium border-primary/30 focus:border-primary/70 focus:bg-background/95 bg-background/80 rounded-2xl resize-none"
                                        disabled={isSubmitting}
                                        maxLength={500}
                                        showCount={false}
                                />
                        </div>

                        <StatusMessage error={globalError} success={successMessage} />

                        <Button
                                type="submit"
                                disabled={!isFormComplete || isSubmitting}
                                loading={isSubmitting}
                                variant="gradient"
                                size="large"
                                className="w-full"
                        >
                                {isSubmitting ? "Submitting…" : "Add to Bracket"}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground/70">
                                Your suggestion enters the shared pool for everyone to discover.
                        </p>
                </form>
        );
}

// ============================================================================
// MODAL CONTENT
// ============================================================================

function ModalNameSuggestionContent({ onClose }: { onClose: () => void }) {
        const isMountedRef = useRef(true);
        const nameInputRef = useRef<HTMLInputElement | null>(null);

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
                nameInputRef.current?.focus();
        }, []);

        const handleClose = useCallback(() => {
                if (isSubmitting) {
                        return;
                }
                reset();
                setGlobalError("");
                onClose();
        }, [isSubmitting, onClose, reset, setGlobalError]);

        return (
                <form
                        onSubmit={(e) => {
                                e.preventDefault();
                                void handleSubmit();
                        }}
                        className="flex flex-col gap-4"
                >
                        <p className="text-sm text-muted-foreground leading-relaxed">
                                Got an idea? Suggest a cat name and it'll enter the bracket for everyone to vote on.
                        </p>

                        <div className="space-y-4">
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
                                        placeholder="e.g., Whiskers, Sir Meowsalot"
                                        maxLength={50}
                                        showSuccess={true}
                                        error={touched.name ? errors.name : null}
                                        className="h-11 text-sm"
                                />

                                <Textarea
                                        id="modal-description-input"
                                        label="Why this name?"
                                        value={values.description}
                                        onChange={(e) => {
                                                handleChange("description", e.target.value);
                                                if (globalError) {
                                                        setGlobalError("");
                                                }
                                        }}
                                        onBlur={() => handleBlur("description")}
                                        placeholder="What makes it special?"
                                        disabled={isSubmitting}
                                        maxLength={500}
                                        rows={3}
                                        error={touched.description ? errors.description : null}
                                        showCount={true}
                                        className="text-sm resize-none"
                                />
                        </div>

                        <StatusMessage error={globalError} success={success} />

                        <div className="flex justify-end gap-2 pt-3 border-t border-border/30">
                                <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                                        Cancel
                                </Button>
                                <Button
                                        type="submit"
                                        variant="glass"
                                        disabled={isSubmitting || !isValid}
                                        loading={isSubmitting}
                                >
                                        Submit Suggestion
                                </Button>
                        </div>
                </form>
        );
}

// ============================================================================
// UNIFIED EXPORT
// ============================================================================

export function NameSuggestion({ variant = "inline", onClose }: NameSuggestionProps) {
        const handleClose = onClose ?? (() => undefined);

        if (variant === "modal") {
                return <ModalNameSuggestionContent onClose={handleClose} />;
        }
        return <NameSuggestionInner />;
}
