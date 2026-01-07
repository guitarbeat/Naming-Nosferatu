import type React from "react";
import styles from "./ColumnHeader.module.css";

interface ColumnHeaderProps {
	label: string;
	metricName?: string;
	sortable?: boolean;
	sorted?: boolean;
	sortDirection?: "asc" | "desc";
	onSort?: (field: string, direction: "asc" | "desc") => void;
	className?: string;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
	label,
	metricName,
	sortable = true,
	sorted = false,
	sortDirection = "desc",
	onSort,
	className = "",
}) => {
	const handleSort = () => {
		if (!sortable || !onSort || !metricName) {
			return;
		}
		const newDirection = sorted && sortDirection === "desc" ? "asc" : "desc";
		onSort(metricName, newDirection);
	};

	const headerClass = [styles.columnHeaderButton, sorted ? styles.sorted : "", className]
		.filter(Boolean)
		.join(" ");

	const content = (
		<div className={styles.columnHeaderLabel}>
			<span className={styles.columnHeaderText}>{label}</span>
			{sortable && sorted && (
				<span className={styles.columnHeaderSortIndicator} aria-hidden="true">
					{sortDirection === "desc" ? "▼" : "▲"}
				</span>
			)}
			{metricName && (
				<span
					title={`Metric: ${metricName}`}
					style={{
						marginLeft: "4px",
						opacity: 0.7,
						fontSize: "0.8em",
						cursor: "help",
					}}
				>
					ⓘ
				</span>
			)}
		</div>
	);

	if (!sortable) {
		return (
			<div className={`${styles.columnHeader} ${className}`}>
				<div className={styles.columnHeaderLabel}>
					<span className={styles.columnHeaderText}>{label}</span>
				</div>
			</div>
		);
	}

	return (
		<button
			className={headerClass}
			onClick={handleSort}
			aria-sort={sorted ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
			type="button"
		>
			{content}
		</button>
	);
};
