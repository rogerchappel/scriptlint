import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const packageName = '@rogerchappel/scriptlint';
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scriptlint-package-'));

try {
  const packOutput = execFileSync('npm', ['pack', '--json', '--pack-destination', tempDir], {
    encoding: 'utf8',
  });
  const [{ filename }] = JSON.parse(packOutput);
  const tarball = path.join(tempDir, filename);

  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], {
    cwd: tempDir,
    stdio: 'pipe',
  });

  const installedManifest = JSON.parse(
    fs.readFileSync(path.join(tempDir, 'node_modules', ...packageName.split('/'), 'package.json'), 'utf8'),
  );
  assert.equal(installedManifest.name, packageName);
  assert.deepEqual(installedManifest.bin, { scriptlint: './src/index.js' });

  const binary = path.join(tempDir, 'node_modules', '.bin', 'scriptlint');
  assert.match(execFileSync(binary, ['--help'], { encoding: 'utf8' }), /Usage:/);
  assert.equal(execFileSync(binary, ['--version'], { encoding: 'utf8' }), `${installedManifest.version}\n`);

  console.log(`Packed package smoke passed: ${packageName} exposes scriptlint.`);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
