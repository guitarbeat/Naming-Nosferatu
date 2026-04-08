import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";
import { Button, Input, Textarea } from "@/shared/components/layout";
import { useNameSuggestion } from "@/shared/hooks";
import { CheckCircle, X } from "@/shared/lib/icons";

// ============================================================================
// TYPES
// ============================================================================

interface NameSuggestionProps {
	variant?: "inline" | "modal";
	isOpen?: boolean;
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
		<form onSubmit={handleLocalSubmit} className="w-full max-w-lg mx-auto space-y-6">
			<div className="text-center space-y-2">
				<h3 className="text-xl sm:text-2xl font-bold text-foreground">What would you name him?</h3>
				<p className="text-sm text-muted-foreground">
					Every suggestion enters the bracket for voting.
				</p>
			</div>

			<div className="space-y-2">
				<div className="flex items-baseline justify-between">
					<label htmlFor="suggest-name" className="text-sm font-medium text-foreground/80">
						Suggested Name
					</label>
					<span className="text-[11px] text-muted-foreground/60 tabular-nums">
						{values.name.length}/50
					</span>
				</div>
				<Input
					id="suggest-name"
					type="text"
					value={values.name}
					onChange={(e) => handleChange("name", e.target.value)}
					placeholder="e.g. Count Whiskula, Sir Paws-a-lot"
					className="h-12 text-base border-border/40 focus:border-primary bg-foreground/[0.03]"
					disabled={isSubmitting}
					maxLength={50}
				/>
			</div>

			<div className="space-y-2">
				<div className="flex items-baseline justify-between">
					<label htmlFor="suggest-description" className="text-sm font-medium text-foreground/80">
						Why This Name?
					</label>
					<span className="text-[11px] text-muted-foreground/60 tabular-nums">
						{values.description.length}/500
					</span>
				</div>
				<Textarea
					id="suggest-description"
					value={values.description}
					onChange={(e) => handleChange("description", e.target.value)}
					placeholder="What makes it special? Help voters feel the vibe."
					rows={4}
					className="text-base border-border/40 focus:border-primary bg-foreground/[0.03] resize-none"
					disabled={isSubmitting}
					maxLength={500}
					showCount={false}
				/>
			</div>

			<Button
				type="submit"
				disabled={!isFormComplete || isSubmitting}
				loading={isSubmitting}
				variant="glass"
				size="large"
				className="w-full"
			>
				{isSubmitting ? "Submitting…" : "Add to Bracket"}
			</Button>

			<p className="text-[11px] text-center text-muted-foreground/60">
				Goes into the shared pool for everyone to discover
			</p>

			<StatusMessage error={globalError} success={successMessage} />
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

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				reset();
				onClose();
			}
		};
		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [onClose, reset]);

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
	if (variant === "modal") {
		return <ModalNameSuggestionContent onClose={onClose || (() => {})} />;
	}
	return <NameSuggestionInner />;
}
