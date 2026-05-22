# ScriptLint PRD

Status: in-progress

## Summary

ScriptLint is a local-first TypeScript CLI that scans shell scripts (bash, zsh, fish) across a project for anti-patterns, security risks, portability hazards, and style issues — without executing any code.

## Motivation

Shell scripts are everywhere in dev projects (CI, build hooks, install scripts, deployment wrappers), but they're rarely reviewed with the same rigor as application code. Common issues like unquoted variables, unhandled errors (`set -e` missing), hardcoded secrets, unsafe `eval`, insecure temp files, and non-portable syntax cause subtle bugs and real security vulnerabilities. ScriptLint catches these at rest.

## Target users

- OSS maintainers with CI/build scripts
- DevOps engineers reviewing deployment automation
- Developers writing shell hooks or installers
- Security-conscious teams with agentic workflows

## Goals

- Scan all `.sh`, `.bash`, `.zsh`, `.fish` files in a directory tree
- Detect security risks: `eval`, unquoted variables in critical contexts, unsafe temp file creation, hardcoded secrets/patterns, `curl | bash` patterns
- Detect reliability issues: missing `set -euo pipefail`, ignored error returns, missing `#!/usr/bin/env` shebang
- Detect style issues: inconsistent indentation, deprecated syntax (`[` vs `[[`, backticks vs `$()`)
- Output: categorized report with severity (critical/warning/info), file:line references, and fix suggestions
- Support `--strict` for zero-tolerance mode, `--ignore` for known-acceptable patterns
- Exit non-zero on critical findings (CI-friendly)
- JSON output mode for programmatic consumption
- Support `--stdin` for checking piped script content

## Non-goals

- Auto-fixing scripts (report only; suggests fixes)
- Full static analysis / interpreter emulation
- Cross-script call graph analysis

## Source attribution

Inspired by shellcheck (the gold standard for shell script analysis). ScriptLint is NOT a replacement for shellcheck — it's a lighter-weight complement focused on project-wide scanning, security-first rules, and agentic CI integration with a simpler rule set. It does not attempt to parse shell semantics as deeply; instead it uses regex + AST-pattern matching for the highest-impact rules.
