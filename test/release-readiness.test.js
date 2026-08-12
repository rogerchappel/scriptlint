import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { test } from 'node:test';

const execFileAsync = promisify(execFile);

test('release readiness rejects the known third-party package identity offline', async () => {
  const fixtureDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scriptlint-readiness-'));
  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
  packageJson.name = 'scriptlint';
  const fixturePath = path.join(fixtureDir, 'package.json');
  await fs.writeFile(fixturePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  await assert.rejects(
    execFileAsync('node', ['scripts/validate-release-readiness.mjs'], {
      env: { ...process.env, RELEASE_READINESS_PACKAGE_PATH: fixturePath },
    }),
    (error) => {
      assert.match(error.stderr, /must not use the third-party unscoped scriptlint identity/);
      return true;
    },
  );
});
