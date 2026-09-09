import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { test } from "node:test";

const execFileAsync = promisify(execFile);
const { version } = JSON.parse(await readFile("package.json", "utf8"));

test("scriptlint --help describes the current scaffold", async () => {
  const { stdout, stderr } = await execFileAsync("node", ["src/index.js", "--help"]);

  assert.equal(stderr, "");
  assert.match(stdout, /scriptlint/);
  assert.match(stdout, /Usage:/);
});

test("scriptlint accepts documented help aliases", async () => {
  for (const args of [[], ["help"], ["-h"]]) {
    const { stdout, stderr } = await execFileAsync("node", ["src/index.js", ...args]);

    assert.equal(stderr, "");
    assert.match(stdout, /Usage:/);
  }
});

test("scriptlint --version prints the package version", async () => {
  const { stdout, stderr } = await execFileAsync("node", ["src/index.js", "--version"]);

  assert.equal(stderr, "");
  assert.equal(stdout, `${version}\n`);
});

test("scriptlint accepts documented version aliases", async () => {
  for (const arg of ["version", "-v"]) {
    const { stdout, stderr } = await execFileAsync("node", ["src/index.js", arg]);

    assert.equal(stderr, "");
    assert.equal(stdout, `${version}\n`);
  }
});

test("scriptlint rejects unknown commands, options, and extra operands", async () => {
  for (const args of [["frobnicate"], ["--bogus"], ["--help", "extra"]]) {
    await assert.rejects(
      execFileAsync("node", ["src/index.js", ...args]),
      (error) => {
        assert.equal(error.code, 1);
        assert.equal(error.stdout, "");
        assert.match(error.stderr, /Unknown argument|Unexpected extra operand/);
        assert.match(error.stderr, /Run 'scriptlint --help' for usage\./);
        return true;
      },
    );
  }
});
