console.time("reduce");
for (let n = 0; n < 10000; n++) {
    const leftParticipantIds = ["1", "2"];
    const stats = { "1": { wins: 5, losses: 2 }, "2": { wins: 3, losses: 1 } };

    function normalizeStats(stats) {
        return {
            wins: stats?.wins ?? 0,
            losses: stats?.losses ?? 0,
        };
    }

    const leftAggregateStats = leftParticipantIds.reduce(
		(acc, participantId) => {
			const participantStats = normalizeStats(stats?.[participantId]);
			acc.wins += participantStats.wins;
			acc.losses += participantStats.losses;
			return acc;
		},
		{ wins: 0, losses: 0 },
	);
}
console.timeEnd("reduce");

console.time("loop");
for (let n = 0; n < 10000; n++) {
    const leftParticipantIds = ["1", "2"];
    const stats = { "1": { wins: 5, losses: 2 }, "2": { wins: 3, losses: 1 } };

    function normalizeStats(stats) {
        return {
            wins: stats?.wins ?? 0,
            losses: stats?.losses ?? 0,
        };
    }

    const leftAggregateStats = { wins: 0, losses: 0 };
    for (let i = 0; i < leftParticipantIds.length; i++) {
        const participantStats = normalizeStats(stats?.[leftParticipantIds[i]]);
        leftAggregateStats.wins += participantStats.wins;
        leftAggregateStats.losses += participantStats.losses;
    }
}
console.timeEnd("loop");
