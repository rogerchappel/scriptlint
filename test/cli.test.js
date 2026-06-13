import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { test } from "node:test";

const execFileAsync = promisify(execFile);

test("scriptlint --help describes the current scaffold", async () => {
  const { stdout, stderr } = await execFileAsync("node", ["src/index.js", "--help"]);

  assert.equal(stderr, "");
  assert.match(stdout, /scriptlint/);
  assert.match(stdout, /Usage:/);
});

test("scriptlint --version prints the package version", async () => {
  const { stdout, stderr } = await execFileAsync("node", ["src/index.js", "--version"]);

  assert.equal(stderr, "");
  assert.equal(stdout, "0.1.0\n");
});
