import fs from 'fs';

let content = fs.readFileSync('src/shared/components/layout/CatNameHero.tsx', 'utf8');
content = content.replace(/className="cat-name-hero__name"\n\t\t\t\t\taria-label=\{isSet \? nameParts\.join\(" "\) : "Name not yet chosen"\}/, `className="cat-name-hero__name"\n\t\t\t\t\taria-label={isSet ? nameParts.join(" ") : "Name not yet chosen"}\n\t\t\t\t\trole="region"`);
content = content.replace(/key=\{i\}/g, `key={\`\${part}-\${crypto.randomUUID()}\`}`);
content = content.replace(/<svg\n\t\t\t\t\tclassName="cat-name-hero__scroll-arrow"/, `<svg\n\t\t\t\t\tclassName="cat-name-hero__scroll-arrow"\n\t\t\t\t\trole="img"\n\t\t\t\t\taria-label="Scroll down"`);
fs.writeFileSync('src/shared/components/layout/CatNameHero.tsx', content);

let content2 = fs.readFileSync('src/shared/components/layout/AppLayout.tsx', 'utf8');
content2 = content2.replace(/role="status"/, `role="region" aria-label="status"`);
fs.writeFileSync('src/shared/components/layout/AppLayout.tsx', content2);
