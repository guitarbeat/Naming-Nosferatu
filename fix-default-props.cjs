const fs = require('fs');
const file = 'src/features/tournament/TournamentArena.tsx';
let content = fs.readFileSync(file, 'utf8');

if (content.includes('names = [],')) {
  // Insert EMPTY_ARRAY at the top
  if (!content.includes('const EMPTY_NAMES')) {
    content = content.replace(/function TournamentContent/, 'const EMPTY_NAMES: string[] = [];\n\nfunction TournamentContent');
  }
  content = content.replace(/names = \[\],/, 'names = EMPTY_NAMES,');
  fs.writeFileSync(file, content);
  console.log('Fixed names = [] in TournamentArena.tsx');
}
