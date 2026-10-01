## 2024-05-18 - Avoid O(N) inline function allocations in loops creating props

**Learning:** When passing generated item arrays as props to child components (like \`DriftWall\`), mapping inline functions (e.g., \`onClick: () => handler(item.id)\`) to every item in the array causes \`N\` function allocations on every single render. If this array is used inside \`useMemo\`, it forces it to recreate objects constantly.
**Action:** Extract inline closures from item arrays by utilizing a single delegated event handler prop (like \`onItemClick\`) on the parent component (e.g. \`<DriftWall onItemClick={(item) => handler(item.id)} />\`) instead of burying them inside the item data structures.
