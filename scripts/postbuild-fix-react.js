import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'glob';

// * Fix glob pattern to match both vendor-react-*.js and react-vendor-*.js patterns
const reactFiles = globSync('dist/assets/js/{vendor-react,react-vendor}-*.js');
for (const file of reactFiles) {
  let code = readFileSync(file, 'utf8');
  let patched = false;

  // * Pattern 1: Fix React Children initialization
  const childrenPattern = new RegExp(
    [
      '(ReactCurrentOwner:[^}]+}',
      '\\s*[,;]?\\s*[\\s\\S]*?)react_production_min\\.Children=\\{',
    ].join('')
  );
  if (childrenPattern.test(code)) {
    code = code.replace(
      childrenPattern,
      (_match, prefix) =>
        `${prefix}return (react_production_min || (react_production_min = {})).Children={`
    );
    patched = true;
  }

  // * Pattern 2: Fix requireReact guard
  const requirePattern = /function requireReact \(\) {\s+if \(hasRequiredReact\) return react\.exports;/;
  if (requirePattern.test(code)) {
    code = code.replace(
      requirePattern,
      'function requireReact () {\n        if (!react) react = { exports: {} };\n        if (hasRequiredReact) return react.exports;'
    );
    patched = true;
  }

  // * Pattern 3: Fix React 19 Activity property initialization issue
  if (code.includes('.Activity')) {
    code = code.replace(
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\.Activity\s*=/g,
      '($1 = $1 || {}).Activity ='
    );
    patched = true;
  }

  // * Pattern 4: Fix CommonJS module initialization (new pattern for Vite 7)
  // * This handles cases where modules try to set .exports on undefined objects
  // * Look for patterns like: function m() { ... } where m might be called before initialization
  // * We need to ensure the module object exists before setting properties on it

  // Find all variable declarations that look like module wrappers
  const moduleVarPattern = /var ([a-z])={exports:{}}/g;
  const moduleVars = new Set();
  let match;
  while ((match = moduleVarPattern.exec(code)) !== null) {
    moduleVars.add(match[1]);
  }

  // For each module variable, ensure it's initialized before use
  if (moduleVars.size > 0) {
    for (const varName of moduleVars) {
      // Look for patterns where the variable might be used before initialization
      // Pattern: varName.exports = ...
      const unsafePattern = new RegExp(
        `(?<!var ${varName}={exports:{}};)([^a-zA-Z0-9_$])${varName}\\.exports\\s*=`,
        'g'
      );

      // Replace with safe initialization
      const replacement = `$1(${varName} = ${varName} || {exports:{}}).exports =`;
      const newCode = code.replace(unsafePattern, replacement);

      if (newCode !== code) {
        code = newCode;
        patched = true;
      }
    }
  }

  // * Additional safety: Ensure all .exports assignments have a safe target
  // * This catches any remaining cases where .exports is set on potentially undefined objects
  const exportsPattern = /([a-zA-Z_$][a-zA-Z0-9_$]*)\.exports\s*=/g;
  const safeExportsCode = code.replace(exportsPattern, (match, varName) => {
    // Don't double-wrap already safe assignments
    if (code.includes(`(${varName} = ${varName} || {exports:{}}).exports`)) {
      return match;
    }
    // Check if this variable is declared nearby (within 100 chars before)
    const matchIndex = code.indexOf(match);
    const contextBefore = code.substring(Math.max(0, matchIndex - 100), matchIndex);

    // If we see a declaration like "var x={exports:{}}" nearby, it's probably safe
    if (contextBefore.includes(`var ${varName}={exports:{}}`) ||
      contextBefore.includes(`var ${varName} = {exports:{}}`) ||
      contextBefore.includes(`let ${varName}={exports:{}}`) ||
      contextBefore.includes(`const ${varName}={exports:{}}`)) {
      return match;
    }

    // Otherwise, make it safe
    return `(${varName} = ${varName} || {exports:{}}).exports =`;
  });

  if (safeExportsCode !== code) {
    code = safeExportsCode;
    patched = true;
  }

  if (patched) {
    writeFileSync(file, code, 'utf8');
    console.log(`[postbuild-fix-react] Patched ${file}`);
  } else {
    console.warn(`[postbuild-fix-react] No patterns matched in ${file} - this may be okay if the build output changed`);
  }
}

const miscFiles = globSync('dist/assets/js/vendor-misc-*.js');
for (const file of miscFiles) {
  let code = readFileSync(file, 'utf8');
  const eagerRequirePattern = /\brequireWithSelector\(\);/;
  if (eagerRequirePattern.test(code) && !code.includes('__withSelectorModule')) {
    code = code.replace(
      eagerRequirePattern,
      `var __withSelectorModule;
Object.defineProperty(withSelector, 'exports', {
  configurable: true,
  get() {
    if (__withSelectorModule === void 0) {
      __withSelectorModule = requireWithSelector();
    }
    return __withSelectorModule;
  },
  set(value) {
    __withSelectorModule = value;
  }
});`
    );
    writeFileSync(file, code, 'utf8');
    console.log(`[postbuild-fix-react] Patched ${file}`);
  } else {
    console.warn(`[postbuild-fix-react] Skipped ${file} (pattern not found or already patched)`);
  }
}
