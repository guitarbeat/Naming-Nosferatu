const fs = require('fs');
const file = 'src/features/tournament/components/NameSelector.tsx';
let content = fs.readFileSync(file, 'utf8');

const handleToggleAllDef = `
	const handleToggleAll = useCallback(() => {
		if (selectedNames.size > 0) {
			setSelectedNames(new Set());
			return;
		}

		const newSelected = new Set<IdType>();
		for (const item of renderItems) { newSelected.add(item.id); }
		setSelectedNames(newSelected);
	}, [selectedNames.size, renderItems]);

	if (isLoading) {
`;

// Make sure it doesn't double add
if (!content.includes("const handleToggleAll = useCallback(")) {
    content = content.replace('if (isLoading) {', handleToggleAllDef);
    fs.writeFileSync(file, content);
}
