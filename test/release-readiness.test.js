import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { test } from 'node:test';

const execFileAsync = promisify(execFile);

async function executePackStep(workflowFile) {
  const workflow = await fs.readFile(path.join('.github', 'workflows', workflowFile), 'utf8');
  const match = workflow.match(/      - name: Pack release artifact\n        id: pack\n        run: \|\n((?:          .*\n)+)/);
  assert.ok(match, `${workflowFile} must contain the pack step`);

  const fixtureDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scriptlint-pack-step-'));
  const binDir = path.join(fixtureDir, 'bin');
  const outputPath = path.join(fixtureDir, 'github-output');
  await fs.mkdir(binDir);
  await fs.writeFile(
    path.join(binDir, 'npm'),
    '#!/bin/sh\nprintf \'[{"filename":"rogerchappel-scriptlint-0.1.0.tgz"}]\\n\'\n',
    { mode: 0o755 },
  );

  const script = match[1].replace(/^ {10}/gm, '');
  await execFileAsync('bash', ['-n', '-c', script]);
  await execFileAsync('bash', ['-euo', 'pipefail', '-c', script], {
    cwd: fixtureDir,
    env: { ...process.env, GITHUB_OUTPUT: outputPath, PATH: `${binDir}:${process.env.PATH}` },
  });

  assert.equal(await fs.readFile(outputPath, 'utf8'), 'tarball=rogerchappel-scriptlint-0.1.0.tgz\n');
}

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

for (const workflowFile of ['release.yml', 'release-dry-run.yml']) {
  test(`${workflowFile} pack step is valid shell and writes the packed filename`, async () => {
    await executePackStep(workflowFile);
  });
}

for (const [name, file, mutate, expected] of [
  ['omitted publication', 'release.yml', (text) => text.replace(/      - name: Publish package to npm\n        run:.*\n/, ''), /must publish the captured tarball/],
  ['repacking before publication', 'release.yml', (text) => text.replace('npm publish', 'npm pack\n          npm publish'), /must run npm pack exactly once/],
  ['uncaptured npm artifact', 'release.yml', (text) => text.replace('"${{ steps.pack.outputs.tarball }}" --access', '*.tgz --access'), /must publish the captured tarball/],
  ['uncaptured GitHub artifact', 'release.yml', (text) => text.replace('"${{ steps.pack.outputs.tarball }}"\n', '*.tgz\n'), /must attach the captured tarball/],
  ['dry-run publication omitted', 'release-dry-run.yml', (text) => text.replace(/      - name: Exercise npm publication\n        run:.*\n/, ''), /must publish the captured tarball/],
  ['dry-run repacking', 'release-dry-run.yml', (text) => text.replace('npm publish', 'npm pack\n          npm publish'), /must run npm pack exactly once/],
  ['trusted-publishing npm preparation omitted', 'release.yml', (text) => text.replace(/      - name: Prepare npm for trusted publishing\n        run: \|\n          npm install --global .*\n          npm --version\n/, ''), /must install the selected trusted-publishing npm version/],
  ['outdated trusted-publishing npm', 'release-dry-run.yml', (text) => text.replace('NPM_VERSION: 11.5.1', 'NPM_VERSION: 10.9.8'), /must select npm 11.5.1 or later/],
  ['npm version logging omitted', 'release-dry-run.yml', (text) => text.replace('          npm --version\n', ''), /must log the selected npm version/],
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
