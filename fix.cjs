const fs = require('fs');
let code = fs.readFileSync('src/shared/lib/sound/resources.test.ts', 'utf-8');
code = code.replace(/for \(const note of pattern!\) \{/g, 'for (const note of pattern \?\? \[\]) {');
fs.writeFileSync('src/shared/lib/sound/resources.test.ts', code);
