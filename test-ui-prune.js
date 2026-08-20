const fs = require('fs');

const data = fs.readFileSync('src/shared/components/layout/Button.tsx', 'utf8');
console.log(data.includes('<button'));
