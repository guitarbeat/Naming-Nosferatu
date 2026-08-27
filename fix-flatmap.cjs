const fs = require('fs');
const file = 'src/features/dashboard/DashboardViews.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the filter and map with a single flatMap
const oldPattern = /\.filter\(\(name\) => personalRatings\[name\.name\] !== undefined\)\n\s*\.map\(\(name\) => \{/g;
content = content.replace(oldPattern, `.flatMap((name) => {\n\t\t\t\tif (personalRatings[name.name] === undefined) return [];`);

fs.writeFileSync(file, content);
console.log('Fixed flatMap in DashboardViews.tsx');
