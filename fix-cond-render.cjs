const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // We look for `{condition && <Tag...}` and replace with `{condition ? <Tag... : null}`
  // Regex is tricky, but we can do a simplified one for single-line statements
  // \{([a-zA-Z0-9_.\(\)\[\]!? ]+?)\s*&&\s*(<[A-Za-z]+.*?>.*?)(\s*)\}
  // Actually a simpler way for exactly `{xxx && <yyy>` where the tag closes on the same line or we capture until `}`.
  
  // A safer regex for single line:
  content = content.replace(/\{([^\{\}]*?)\s+&&\s+(<[A-Za-z][^\{\}]*?)\}/g, (match, cond, tag) => {
    // If there's no unbalanced brackets inside...
    return `{${cond} ? ${tag} : null}`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated conditionals in ${file}`);
  }
});
