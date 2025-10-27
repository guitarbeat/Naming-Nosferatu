#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);

const resolveVitestBin = () => {
  let vitestPackageJsonPath;

  try {
    vitestPackageJsonPath = require.resolve('vitest/package.json');
  } catch (error) {
    return { bin: null, error };
  }

  const vitestPackageJson = require(vitestPackageJsonPath);
  const binField = vitestPackageJson?.bin;

  const binEntry = typeof binField === 'string' ? binField : binField?.vitest;

  if (!binEntry) {
    throw new Error('Could not determine Vitest CLI entry point from package metadata.');
  }

  return { bin: resolve(dirname(vitestPackageJsonPath), binEntry) };
};

const { bin: vitestBin, error: vitestResolveError } = resolveVitestBin();

const rawArgs = process.argv.slice(2);
const vitestArgs = ['run', '--config', 'config/vitest.config.mjs'];
const pathArgs = [];

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index];

  if (arg === '--runTestsByPath') {
    let nextIndex = index + 1;

    while (nextIndex < rawArgs.length && !rawArgs[nextIndex].startsWith('-')) {
      pathArgs.push(rawArgs[nextIndex]);
      nextIndex += 1;
    }

    index = nextIndex - 1;
    continue;
  }

  vitestArgs.push(arg);
}

if (pathArgs.length > 0) {
  vitestArgs.push(...pathArgs);
}

const spawnWith = (command, args) =>
  spawn(command, args, {
    stdio: 'inherit',
    env: process.env,
  });

let child;

if (vitestBin) {
  child = spawnWith('node', [vitestBin, ...vitestArgs]);
} else {
  if (vitestResolveError) {
    console.warn('⚠️  Unable to resolve local Vitest installation, falling back to npx.', vitestResolveError);
  }

  let packageSpecifier = 'vitest';

  try {
    const projectPackageJson = require(resolve(process.cwd(), 'package.json'));
    const declaredVersion =
      projectPackageJson?.devDependencies?.vitest || projectPackageJson?.dependencies?.vitest;

    if (declaredVersion) {
      packageSpecifier = `vitest@${declaredVersion}`;
    }
  } catch (error) {
    console.warn('⚠️  Unable to read package.json for Vitest version, using latest available.', error);
  }

  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  child = spawnWith(npxCommand, ['--yes', packageSpecifier, ...vitestArgs]);
}

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
