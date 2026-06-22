const BUCKET_SIZE = 25;
const numElements = 100000;
const ratings = Array.from({length: numElements}, () => Math.random() * 1000);

console.time("Math.max(...)");
for(let i=0; i<100; i++) {
  Math.max(...ratings);
}
console.timeEnd("Math.max(...)");

console.time("Loop max");
for(let i=0; i<100; i++) {
  let max = -Infinity;
  for (let j = 0; j < ratings.length; j++) {
    if (ratings[j] > max) max = ratings[j];
  }
}
console.timeEnd("Loop max");
