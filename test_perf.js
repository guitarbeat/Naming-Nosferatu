const ratings = {};
for (let i = 0; i < 1000; i++) {
  ratings[`name-${i}`] = { rating: 1500, wins: i % 10, losses: i % 5 };
}

console.time("Object.entries + reduce");
for (let n = 0; n < 1000; n++) {
    const ratingsWithStats = Object.entries(ratings).reduce(
        (acc, [nameId, ratingData]) => {
            const rating = typeof ratingData === "number" ? ratingData : ratingData.rating;
            const wins = typeof ratingData === "number" ? 0 : (ratingData.wins ?? 0);
            const losses = typeof ratingData === "number" ? 0 : (ratingData.losses ?? 0);
            acc[nameId] = {
                rating,
                wins,
                losses,
            };
            return acc;
        },
        {}
    );
}
console.timeEnd("Object.entries + reduce");

console.time("Object.keys + for loop");
for (let n = 0; n < 1000; n++) {
    const ratingsWithStats = {};
    const keys = Object.keys(ratings);
    for (let i = 0; i < keys.length; i++) {
        const nameId = keys[i];
        const ratingData = ratings[nameId];
        const rating = typeof ratingData === "number" ? ratingData : ratingData.rating;
        const wins = typeof ratingData === "number" ? 0 : (ratingData.wins ?? 0);
        const losses = typeof ratingData === "number" ? 0 : (ratingData.losses ?? 0);
        ratingsWithStats[nameId] = {
            rating,
            wins,
            losses,
        };
    }
}
console.timeEnd("Object.keys + for loop");
