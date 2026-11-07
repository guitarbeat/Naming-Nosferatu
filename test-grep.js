const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');
console.log(content.split('\n').filter(l => l.includes('AppBootScreen') || l.includes('AppChrome')).join('\n'));
