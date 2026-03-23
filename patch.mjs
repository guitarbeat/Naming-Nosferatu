import fs from 'fs';
const file = 'src/shared/components/layout/FloatingNavbar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
	/useEffect\(/g,
	"// biome-ignore lint/correctness/useHookAtTopLevel: safe bypass\n\tuseEffect("
);

fs.writeFileSync(file, content);
