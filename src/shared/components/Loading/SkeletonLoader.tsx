/**
 * @module SkeletonLoader
 * @description Reusable skeleton loading component with multiple variants.
 */

import React from "react";
import styles from "./SkeletonLoader.module.css";

export interface SkeletonLoaderProps {
	/**
	 * Variant of the skeleton
	 * @default "text"
	 */
	variant?: "text" | "circle" | "card" | "rect";
	/**
	 * Width of the skeleton
	 * @default "100%"
	 */
	width?: string | number;
	/**
	 * Height of the skeleton
	 * @default undefined (depends on variant)
	 */
	height?: string | number;
	/**
	 * Additional class names
	 */
	className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
	variant = "text",
	width,
	height,
	className = "",
}) => {
	const style = {
		width: width,
		height: height,
	};

	return (
		<div
			className={`${styles.skeleton} ${styles[variant] || ""} ${className}`}
			style={style}
			aria-hidden="true"
		/>
	);
};

export default SkeletonLoader;
