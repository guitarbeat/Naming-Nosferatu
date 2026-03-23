import fs from 'fs';

const filePath = 'src/shared/components/layout/FloatingNavbar.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The file has conditionally called hooks:
//
// 	if (isTournamentRoute) {
// 		return null;
// 	}
//
// 	useEffect(() => { ...

// To fix without breaking tests, we must move this return to AFTER all hooks.
// Let's find the last hook. The last hook is usually `useEffect(() => { ...`

// Let's remove the first return completely.
content = content.replace(
	/\/\/\s*The UI spec \+ test suite expect the primary navigation to be hidden on the tournament route\.\r?\n\s*if \(isTournamentRoute\) \{\r?\n\s*return null;\r?\n\s*\}/,
	''
);

// Add the return right before `return (\n\t\t<AnimatePresence`
content = content.replace(
	/return \(\s*<AnimatePresence/,
	'// The UI spec + test suite expect the primary navigation to be hidden on the tournament route.\n\tif (isTournamentRoute) {\n\t\treturn null;\n\t}\n\n\treturn (\n\t\t<AnimatePresence'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed FloatingNavbar.tsx');
