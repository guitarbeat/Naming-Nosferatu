const BUCKET_SIZE = 25;
const numElements = 20000;
const ratings = Array.from({length: numElements}, () => Math.random() * 1000);
const data = Array.from({length: 100}, (_, i) => ({count: Math.floor(Math.random() * 1000)}));

console.time("Old MinMax");
for(let i=0; i<100; i++) {
  const minBucket = Math.floor(Math.min(...ratings) / BUCKET_SIZE) * BUCKET_SIZE;
  const maxBucket = Math.ceil(Math.max(...ratings) / BUCKET_SIZE) * BUCKET_SIZE;
}
console.timeEnd("Old MinMax");

console.time("New MinMax");
for(let i=0; i<100; i++) {
  let minRating = Infinity;
  let maxRating = -Infinity;
  for (let j = 0; j < ratings.length; j++) {
    const r = ratings[j];
    if (r < minRating) minRating = r;
    if (r > maxRating) maxRating = r;
  }
  const minBucket = Math.floor(minRating / BUCKET_SIZE) * BUCKET_SIZE;
  const maxBucket = Math.ceil(maxRating / BUCKET_SIZE) * BUCKET_SIZE;
}
console.timeEnd("New MinMax");
