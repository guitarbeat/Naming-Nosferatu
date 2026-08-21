const n = 1000;
const arr = Array.from({length: n}, (_, i) => i);
let t1 = Date.now();
for (let i = 0; i < 10000; i++) {
  arr.filter(x => x % 2 === 0).length;
}
let t2 = Date.now();
console.log('filter length', t2 - t1);

t1 = Date.now();
for (let i = 0; i < 10000; i++) {
  let c = 0;
  for (let j = 0; j < arr.length; j++) {
    if (arr[j] % 2 === 0) c++;
  }
}
t2 = Date.now();
console.log('for loop', t2 - t1);
