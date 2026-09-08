const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

code = code.replace(
  /.staggered-menu-header \{\s+position: absolute;\s+top: 14px;\s+right: 1.5rem;\s+width: auto;\s+height: auto;\s+display: flex;\s+align-items: center;\s+justify-content: center;\s+gap: 1rem;\s+padding: 0.35rem 1.25rem;\s+background: rgba\(82, 39, 255, 0.65\);\s+backdrop-filter: blur\(12px\);\s+border: 1px solid rgba\(255, 255, 255, 0.3\);\s+border-radius: 9999px;\s+box-shadow: 0 8px 32px rgba\(82, 39, 255, 0.35\);\s+z-index: 20;\s+\}/,
  \`.staggered-menu-header {
	position: absolute;
	top: 14px;
	right: 1.5rem;
	width: auto;
	height: auto;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 1rem;
	padding: 0;
	z-index: 20;
}\`
);

fs.writeFileSync('src/index.css', code);
