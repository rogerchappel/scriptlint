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

test('release readiness verifies a single captured artifact is published and released', async () => {
  await execFileAsync('node', ['scripts/validate-release-readiness.mjs']);
});

for (const [name, file, mutate, expected] of [
  ['omitted publication', 'release.yml', (text) => text.replace(/      - name: Publish package to npm\n        run:.*\n/, ''), /must publish the captured tarball/],
  ['repacking before publication', 'release.yml', (text) => text.replace('npm publish', 'npm pack\n          npm publish'), /must run npm pack exactly once/],
  ['uncaptured npm artifact', 'release.yml', (text) => text.replace('"${{ steps.pack.outputs.tarball }}" --access', '*.tgz --access'), /must publish the captured tarball/],
  ['uncaptured GitHub artifact', 'release.yml', (text) => text.replace('"${{ steps.pack.outputs.tarball }}"\n', '*.tgz\n'), /must attach the captured tarball/],
  ['dry-run publication omitted', 'release-dry-run.yml', (text) => text.replace(/      - name: Exercise npm publication\n        run:.*\n/, ''), /must publish the captured tarball/],
  ['dry-run repacking', 'release-dry-run.yml', (text) => text.replace('npm publish', 'npm pack\n          npm publish'), /must run npm pack exactly once/],
]) {
  test(`release readiness rejects ${name}`, async () => {
    const fixtureDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scriptlint-workflows-'));
    await fs.cp('.github/workflows', fixtureDir, { recursive: true });
    const workflowPath = path.join(fixtureDir, file);
    await fs.writeFile(workflowPath, mutate(await fs.readFile(workflowPath, 'utf8')));

    await assert.rejects(
      execFileAsync('node', ['scripts/validate-release-readiness.mjs'], {
        env: { ...process.env, RELEASE_READINESS_WORKFLOW_DIR: fixtureDir },
      }),
      (error) => {
        assert.match(error.stderr, expected);
        return true;
      },
    );
  });
}
