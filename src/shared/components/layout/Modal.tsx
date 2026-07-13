import { X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

interface ModalProps {
	title: string;
	open?: boolean;
	onClose: () => void;
	children: React.ReactNode;
	closeDisabled?: boolean;
	description?: string;
	hideTitle?: boolean;
}

const EXIT_DURATION_MS = 220;

function useModalAnimation(isOpenResolved: boolean) {
	const [isClosing, setIsClosing] = useState(false);
	const [shouldRender, setShouldRender] = useState(isOpenResolved);

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
		}, EXIT_DURATION_MS);
		return () => window.clearTimeout(timer);
	}, [isOpenResolved, shouldRender]);

	return { isClosing, shouldRender };
}

interface ModalHeaderProps {
	title: string;
	hideTitle: boolean;
	requestClose: () => void;
	closeDisabled: boolean;
}

function ModalHeader({
	title,
	hideTitle,
	requestClose,
	closeDisabled,
}: ModalHeaderProps) {
	if (hideTitle) {
		return (
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
					title={closeDisabled ? "Closing is currently disabled" : "Close"}
				>
					<X className="size-4" />
				</button>
			</>
		);
	}

	return (
		<div className="flex items-center justify-between mb-5">
			<h2
				id="modal-title"
				className="text-base font-semibold text-foreground tracking-tight"
			>
				{title}
			</h2>
			<button
				type="button"
				onClick={requestClose}
				disabled={closeDisabled}
				className="rounded-full p-1.5 text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				aria-label={`Close ${title.toLowerCase()}`}
				title={closeDisabled ? "Closing is currently disabled" : "Close"}
			>
				<X className="size-4" />
			</button>
		</div>
	);
}

export function Modal({
	title,
	open,
	onClose,
	children,
	closeDisabled = false,
	description,
	hideTitle = false,
}: ModalProps) {
	const isOpenResolved = open ?? true;
	const { isClosing, shouldRender } = useModalAnimation(isOpenResolved);

	const requestClose = () => {
		if (closeDisabled) {
			return;
		}
		onClose();
	};

	if (!shouldRender) {
		return null;
	}

	const surfaceAnimation = isClosing
		? "motion-safe:animate-[fadeIn_180ms_ease-out_reverse_forwards]"
		: "motion-safe:animate-[surface-enter_220ms_var(--ease-out-expo)]";
	const overlayAnimation = isClosing
		? "motion-safe:animate-[fadeIn_220ms_ease-out_reverse_forwards]"
		: "motion-safe:animate-[fadeIn_180ms_ease-out]";

	return (
		<div
			className={`fixed inset-0 z-40 flex items-center justify-center px-4 pb-24 sm:pb-4 ${overlayAnimation}`}
		>
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
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				aria-describedby={description ? "modal-description" : undefined}
				tabIndex={-1}
				className={`glass-surface relative z-50 w-full max-w-md overflow-hidden rounded-2xl border border-border/40 bg-card/85 backdrop-blur-xl p-5 sm:p-6 shadow-2xl ${surfaceAnimation}`}
			>
				<ModalHeader
					title={title}
					hideTitle={hideTitle}
					requestClose={requestClose}
					closeDisabled={closeDisabled}
				/>

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
