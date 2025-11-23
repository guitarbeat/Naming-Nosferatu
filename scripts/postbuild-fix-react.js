import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'glob';

// * Fix glob pattern to match both vendor-react-*.js and react-vendor-*.js patterns
const reactFiles = globSync('dist/assets/js/{vendor-react,react-vendor}-*.js');
for (const file of reactFiles) {
  let code = readFileSync(file, 'utf8');
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
  } else {
    console.warn(`[postbuild-fix-react] No Children pattern found in ${file}`);
  }

  const requirePattern = /function requireReact \(\) {\s+if \(hasRequiredReact\) return react\.exports;/;
  if (requirePattern.test(code)) {
    code = code.replace(
      requirePattern,
      'function requireReact () {\n        if (!react) react = { exports: {} };\n        if (hasRequiredReact) return react.exports;'
    );
  } else {
    console.warn(`[postbuild-fix-react] No requireReact guard found in ${file}`);
  }

  // * Fix React 19 Activity property initialization issue
  // * React 19's scheduler may try to set Activity on an undefined object after bundling
  // * This ensures the object exists before setting the Activity property
  if (code.includes('.Activity')) {
    // * Replace assignments like obj.Activity = value
    // * with guarded assignment: (obj = obj || {}).Activity = value
    // * Only handle simple identifier paths (not nested) to avoid issues with undefined parents
    // * In minified code, Activity is typically set on simple variables, not nested objects
    code = code.replace(
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\.Activity\s*=/g,
      '($1 = $1 || {}).Activity ='
    );
  }

  writeFileSync(file, code, 'utf8');
  console.log(`[postbuild-fix-react] Patched ${file}`);
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
