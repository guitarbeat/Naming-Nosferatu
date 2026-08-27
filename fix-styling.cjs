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
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
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

  // 1. Fix contrast: text-muted-foreground/XX -> text-muted-foreground (unless it's 80 or 90, maybe just make it text-muted-foreground to be safe)
  // Let's replace any text-muted-foreground/[0-9]+ with text-muted-foreground
  // But allow placeholder:text-muted-foreground/70? No, let's just make it placeholder:text-muted-foreground
  content = content.replace(/text-muted-foreground\/[0-9]+/g, 'text-muted-foreground');
  
  // 2. Fix text-foreground/XX contrast (usually meant to be muted)
  content = content.replace(/text-foreground\/[0-7][0-9]/g, 'text-muted-foreground');
  
  // 3. Add focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none to buttons if missing
  // We can do this by regexing `<button[^>]*className="[^"]*"` and ensuring focus-visible is present
  content = content.replace(/(<button[^>]*className=["`][^"`]*)(["`])/g, (match, p1, p2) => {
    if (!p1.includes('focus-visible:ring') && !p1.includes('focus:ring')) {
      return p1 + ' focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background' + p2;
    }
    return match;
  });

  // 4. Ensure cursor-pointer on buttons and clickable divs/links
  // If it's a button and doesn't have cursor-pointer (or cursor-not-allowed), add cursor-pointer
  content = content.replace(/(<(?:button|a)[^>]*className=["`][^"`]*)(["`])/g, (match, p1, p2) => {
    if (!p1.includes('cursor-') && !p1.includes('disabled:cursor-not-allowed')) {
      return p1 + ' cursor-pointer disabled:cursor-not-allowed' + p2;
    }
    return match;
  });
  
  // Also add transition-all duration-300 if hover is present but no transition
  content = content.replace(/(className=["`][^"`]*)(["`])/g, (match, p1, p2) => {
    if (p1.includes('hover:') && !p1.includes('transition')) {
      return p1 + ' transition-all duration-300' + p2;
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated styling in ${file}`);
  }
});
