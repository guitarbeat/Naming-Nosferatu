/**
 * @module Tournament/components/TournamentHeader
 * @description Header for tournament view showing progress.
 * @author Aaron Lor
 */

import PropTypes from "prop-types";
import React from "react";
import Card from "../../../../shared/components/Card/Card";
import styles from "../../Tournament.module.css";

interface TournamentHeaderProps {
	roundNumber?: number;
	currentMatchNumber?: number;
	totalMatches?: number;
	progress?: number;
}

function TournamentHeader({
	roundNumber,
	currentMatchNumber,
	totalMatches,
	progress,
}: TournamentHeaderProps) {
	return (
		<Card
			className={styles.progressInfo}
			background="glass"
			padding="none"
			shadow="medium"
			role="status"
			aria-live="polite"
			aria-atomic="true"
		>
			<div className={styles.roundInfo}>
				<span className={styles.roundNumber}>Round {roundNumber}</span>
				<span className={styles.matchCount}>
					Match {currentMatchNumber} of {totalMatches}
				</span>
			</div>
			<div
				className={styles.percentageInfo}
				aria-label={`Tournament is ${progress}% complete`}
			>
				{progress}% Complete
			</div>
		</Card>
	);
}

TournamentHeader.propTypes = {
	roundNumber: PropTypes.number,
	currentMatchNumber: PropTypes.number,
	totalMatches: PropTypes.number,
	progress: PropTypes.number,
};

export default React.memo(TournamentHeader);
