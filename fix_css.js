const fs = require('fs');
let css = fs.readFileSync('src/styles/components.css', 'utf8');

// Replace @utility with a regular class to bypass tailwind v4 parsing error
css = css.replace('@utility glass-surface', '.glass-surface');

fs.writeFileSync('src/styles/components.css', css);
