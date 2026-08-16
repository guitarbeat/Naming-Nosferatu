const fs = require('fs');
const content = fs.readFileSync('src/shared/hooks/useLocalStorage.test.ts', 'utf8');

// Find the last "});" and move it to the end
let lines = content.trimEnd().split('\n');
// We know that `});` is at line 72, which is index 71.
const index = lines.findIndex(l => l === '});');

if (index !== -1) {
  lines.splice(index, 1);
  lines.push('});');
  fs.writeFileSync('src/shared/hooks/useLocalStorage.test.ts', lines.join('\n') + '\n');
}
