import fs from 'fs';
const file = 'src/features/tournament/modes/TournamentFlow.test.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `	tournament: {
		isComplete: false,
		names: null as null | string[],
	},`;

const replacement = `	tournament: {
		isComplete: false,
		names: null as null | string[],
		ratings: {},
	},`;

if (code.includes(target)) {
    fs.writeFileSync(file, code.replace(target, replacement));
    console.log('patched successfully');
} else {
    console.log('target not found');
}
