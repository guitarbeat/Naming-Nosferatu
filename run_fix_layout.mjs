import fs from 'fs';
const file = 'src/shared/components/layout/AppLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/role="status"/g, '');
content = content.replace(/<div\n\t\t\t\t\t\t\t\tclassName="fixed inset-0/g, '<output\n\t\t\t\t\t\t\t\tclassName="fixed inset-0');
content = content.replace(/<Loading variant="spinner" text="Initializing Tournament\.\.\." \/>\n\t\t\t\t\t\t\t<\/div>/g, '<Loading variant="spinner" text="Initializing Tournament..." />\n\t\t\t\t\t\t\t</output>');

fs.writeFileSync(file, content);

const file2 = 'src/shared/components/layout/FloatingNavbar.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(
  'if (isTournamentRoute) {\n\t\treturn null;\n\t}',
  '// wait'
);

content2 = content2.replace(
  'return (\n\t\t<AnimatePresence>',
  'if (isTournamentRoute) return null;\n\n\treturn (\n\t\t<AnimatePresence>'
);
fs.writeFileSync(file2, content2);
