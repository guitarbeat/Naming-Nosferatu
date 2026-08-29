const fs = require('fs');

function test() {
  const content = fs.readFileSync('src/shared/components/UIBlocks.tsx', 'utf-8');
  console.log(content.includes('focus:ring-2'));
}
test();
