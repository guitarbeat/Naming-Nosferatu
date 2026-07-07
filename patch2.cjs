const fs = require('fs');
const file = 'src/shared/lib/userStorage.test.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
	/\/\/ @ts-expect-error Testing invalid input\n\t\t\twriteStoredUserSnapshot\(\{ id: "123" \}\);/,
	'writeStoredUserSnapshot({ id: "123" } as unknown as StoredUserSnapshot);'
);
fs.writeFileSync(file, code);
