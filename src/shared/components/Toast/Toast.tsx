/**
 * @module Toast
 * @description Toast notification components with multiple variants and positioning.
 */

import type React from "react";
import { useCallback, useEffect, useId, useState } from "react";
import LiquidGlass from "../LiquidGlass/LiquidGlass";
import styles from "./Toast.module.css";

/* ========================================= */
/*             TOAST ITEM                    */
/* ========================================= */

export interface ToastItemProps {
	message: string;
	type?: "success" | "error" | "info" | "warning";
	duration?: number;
	onDismiss?: () => void;
	autoDismiss?: boolean;
	className?: string;
}

export const ToastItem: React.FC<ToastItemProps> = ({
	message,
	type = "info",
	duration = 5000,
	onDismiss,
	autoDismiss = true,
	className = "",
}) => {
	const [isVisible, setIsVisible] = useState(true);
	const [isExiting, setIsExiting] = useState(false);
	const toastGlassId = useId();

	const handleDismiss = useCallback(() => {
		setIsExiting(true);
		setTimeout(() => {
			setIsVisible(false);
			onDismiss?.();
		}, 300); // 300ms matches CSS transition
	}, [onDismiss]);

	useEffect(() => {
		if (autoDismiss && duration > 0) {
			const timer = setTimeout(() => {
				handleDismiss();
			}, duration);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [autoDismiss, duration, handleDismiss]);

	if (!isVisible) {
		return null;
	}

	const getTypeIcon = () => {
		switch (type) {
			case "success":
				return "✅";
			case "error":
				return "❌";
			case "warning":
				return "⚠️";
			default:
				return "ℹ️";
		}
	};

	const getTypeClass = () => {
		switch (type) {
			case "success":
				return styles.success;
			case "error":
				return styles.error;
			case "warning":
				return styles.warning;
			default:
				return styles.info;
		}
	};

	return (
		<LiquidGlass
			id={`toast-glass-${toastGlassId.replace(/:/g, "-")}`}
			width={280}
			height={60}
			radius={10}
			scale={-100}
			saturation={1.0}
			frost={0.02}
			inputBlur={6}
			outputBlur={0.4}
			className={styles.toastGlass}
			style={{
				width: "auto",
				height: "auto",
				minWidth: "240px",
				maxWidth: "320px",
			}}
		>
			<div
				className={`
          ${styles.toastItem}
          ${getTypeClass()}
          ${isExiting ? styles.exiting : ""}
          ${className}
        `}
				role="alert"
				aria-live="polite"
				aria-atomic="true"
			>
				<div className={styles.toastContent}>
					<span className={styles.icon}>{getTypeIcon()}</span>
					<span className={styles.message}>{message}</span>
					<button
						onClick={handleDismiss}
						className={styles.dismissButton}
						aria-label="Dismiss notification"
						type="button"
					>
						×
					</button>
				</div>

				{autoDismiss && (
					<div className={styles.progressBar}>
						<div
							className={styles.progressFill}
							style={{
								animationDuration: `${duration}ms`,
								animationPlayState: isExiting ? "paused" : "running",
							}}
						/>
					</div>
				)}
			</div>
		</LiquidGlass>
	);
};

/* ========================================= */
/*             TOAST CONTAINER               */
/* ========================================= */

export interface IToastItem {
	id: string;
	message: string;
	type: "success" | "error" | "info" | "warning";
	duration: number;
	autoDismiss: boolean;
}

export interface ToastContainerProps {
	toasts?: IToastItem[];
	removeToast?: (id: string) => void;
	position?:
		| "top-left"
		| "top-center"
		| "top-right"
		| "bottom-left"
		| "bottom-center"
		| "bottom-right";
	maxToasts?: number;
	className?: string;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
	toasts = [],
	removeToast,
	position = "top-right",
	maxToasts = 5,
	className = "",
}) => {
	const visibleToasts = toasts.slice(0, maxToasts);

	const getPositionClass = () => {
		switch (position) {
			case "top-left":
				return styles.topLeft;
			case "top-center":
				return styles.topCenter;
			case "top-right":
				return styles.topRight;
			case "bottom-left":
				return styles.bottomLeft;
			case "bottom-center":
				return styles.bottomCenter;
			case "bottom-right":
				return styles.bottomRight;
			default:
				return styles.topRight;
		}
	};

	const handleToastDismiss = useCallback(
		(toastId: string) => {
			removeToast?.(toastId);
		},
		[removeToast],
	);

	if (toasts.length === 0) {
		return null;
	}

	return (
		<div
			className={`${styles.toastContainer} ${getPositionClass()} ${className}`}
			role="region"
			aria-label="Notifications"
			aria-live="polite"
			aria-atomic="false"
		>
			{visibleToasts.map((toast) => (
				<ToastItem
					key={toast.id}
					message={toast.message}
					type={toast.type}
					duration={toast.duration}
					autoDismiss={toast.autoDismiss}
					onDismiss={() => handleToastDismiss(toast.id)}
					className={styles.toastContainerItem}
				/>
			))}

			{toasts.length > maxToasts && (
				<div className={styles.hiddenCount}>+{toasts.length - maxToasts} more</div>
			)}
		</div>
	);
};

/* ========================================= */
/*             UNIFIED TOAST                 */
/* ========================================= */

export interface ToastProps extends ToastItemProps, ToastContainerProps {
	variant?: "item" | "container";
}

export const Toast: React.FC<ToastProps> = ({
	variant = "item",
	// Container props
	toasts,
	removeToast,
	position = "top-right",
	maxToasts = 5,
	// Item props
	message,
	type = "info",
	duration = 5000,
	onDismiss,
	autoDismiss = true,
	className = "",
}) => {
	if (variant === "container") {
		return (
			<ToastContainer
				toasts={toasts}
				removeToast={removeToast}
				position={position}
				maxToasts={maxToasts}
				className={className}
			/>
		);
	}

	// Default to item variant
	return (
		<ToastItem
			message={message || ""}
			type={type}
			duration={duration}
			onDismiss={onDismiss}
			autoDismiss={autoDismiss}
			className={className}
		/>
	);
};

Toast.displayName = "Toast";
