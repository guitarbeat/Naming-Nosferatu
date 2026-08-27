const fs = require('fs');
const file = 'src/features/tournament/hooks/index.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const EMPTY_OPTIONS')) {
  content = content.replace(/export function/i, 'const EMPTY_OPTIONS: Record<string, never> = {};\n\nexport function');
}
content = content.replace(/props: UseNameSuggestionProps = \{\}/g, 'props: UseNameSuggestionProps = EMPTY_OPTIONS');
content = content.replace(/options: UseTournamentRealtimeOptions = \{\}/g, 'options: UseTournamentRealtimeOptions = EMPTY_OPTIONS');
fs.writeFileSync(file, content);
console.log('Fixed empty defaults in tournament/hooks/index.ts');
