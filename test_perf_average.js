const values = Array.from({length: 100}, (_, i) => i);
console.time("reduce");
for (let n = 0; n < 100000; n++) {
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
}
console.timeEnd("reduce");

console.time("loop");
for (let n = 0; n < 100000; n++) {
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
        sum += values[i];
    }
    const avg = sum / values.length;
}
console.timeEnd("loop");
