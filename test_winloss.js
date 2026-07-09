const leaderboard = [
  { name: 'Alice', avg_rating: 1500, wins: 5, losses: 2, total_ratings: 7 },
  { name: 'BobTheBuilder', avg_rating: 1400, wins: 1, losses: 6, total_ratings: 7 },
  { name: 'Charlie', avg_rating: 1400, wins: 0, losses: 0, total_ratings: 0 },
];
const limit = 8;
const data = [];
for (let i = 0; i < leaderboard.length && data.length < limit; i++) {
    const e = leaderboard[i];
    const wins = e.wins ?? 0;
    const losses = e.losses ?? 0;
    if (wins + losses > 0) {
        data.push({
            name: e.name.length > 8 ? `${e.name.slice(0, 7)}…` : e.name,
            wins,
            losses,
        });
    }
}
console.log(data);
