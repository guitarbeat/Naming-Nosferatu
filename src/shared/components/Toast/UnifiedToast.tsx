import type React from "react";
import { useEffect, useState } from "react";
import type { FormattedError } from "../../services/errorManager";
import styles from "./Toast.module.css";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface BaseToastProps {
	message: string;
	variant?: ToastVariant;
	autoClose?: boolean;
	duration?: number;
	onClose: () => void;
}

interface ErrorToastProps extends BaseToastProps {
	error: FormattedError;
	variant: "error";
}

interface StandardToastProps extends BaseToastProps {
	variant?: "success" | "warning" | "info";
}

export type ToastProps = ErrorToastProps | StandardToastProps;

export const Toast: React.FC<ToastProps> = (props) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(true);

		if (props.autoClose !== false) {
			const timer = setTimeout(() => {
				setIsVisible(false);
				setTimeout(props.onClose, 300);
			}, props.duration || 5000);

			return () => clearTimeout(timer);
		}
	}, [props.autoClose, props.duration, props.onClose]);

	const getVariantClass = () => {
		if (props.variant === "error" && "error" in props) {
			switch (props.error.severity) {
				case "critical":
					return styles.critical;
				case "high":
					return styles.high;
				case "medium":
					return styles.medium;
				case "low":
					return styles.low;
				default:
					return styles.error;
			}
		}
		return styles[props.variant || "info"];
	};

	const showRetry =
		props.variant === "error" && "error" in props && props.error.isRetryable;

	return (
		<div
			className={`${styles.toast} ${getVariantClass()} ${isVisible ? styles.visible : ""}`}
		>
			<div className={styles.content}>
				<div className={styles.message}>{props.message}</div>
				{showRetry && (
					<button
						className={styles.retryButton}
						onClick={() => {
							window.dispatchEvent(
								new CustomEvent("retry-failed-operation", {
									detail: { errorId: (props as ErrorToastProps).error.id },
								}),
							);
							props.onClose();
						}}
					>
						Retry
					</button>
				)}
				<button className={styles.closeButton} onClick={props.onClose}>
					×
				</button>
			</div>
		</div>
	);
};
