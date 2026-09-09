#!/usr/bin/env node

import { createRequire } from "node:module";

const { version } = createRequire(import.meta.url)("../package.json");

const help = `scriptlint

Early-stage local-first JavaScript CLI scaffold.

Usage:
  scriptlint [--help|-h|help]
  scriptlint [--version|-v|version]

The implementation is intentionally minimal while the project is pre-1.0.
See docs/PRD.md for planned scope.`;

const args = process.argv.slice(2);
const [arg] = args;

if (args.length > 1) {
  console.error(`Unexpected extra operand: ${args[1]}\nRun 'scriptlint --help' for usage.`);
  process.exitCode = 1;
} else if (arg === "--version" || arg === "-v" || arg === "version") {
  console.log(version);
} else if (arg === undefined || arg === "--help" || arg === "-h" || arg === "help") {
  console.log(help);
} else {
  console.error(`Unknown argument: ${arg}\nRun 'scriptlint --help' for usage.`);
  process.exitCode = 1;
}
