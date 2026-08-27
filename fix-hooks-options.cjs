const fs = require('fs');
const file = 'src/shared/hooks/index.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const EMPTY_OPTIONS')) {
  content = content.replace(/export function/i, 'const EMPTY_OPTIONS: Record<string, never> = {};\nconst EMPTY_ARRAY: never[] = [];\n\nexport function');
}
content = content.replace(/options: \{ debounceWait\?: number; onError\?: \(error: unknown\) => void \} = \{\},/g, 'options: { debounceWait?: number; onError?: (error: unknown) => void } = EMPTY_OPTIONS,');
content = content.replace(/options: UseAsyncDataOptions = \{\},/g, 'options: UseAsyncDataOptions = EMPTY_OPTIONS,');
content = content.replace(/const \{ deps = \[\] \} = options;/g, 'const { deps = EMPTY_ARRAY } = options;');
fs.writeFileSync(file, content);
console.log('Fixed empty defaults in hooks/index.ts');
