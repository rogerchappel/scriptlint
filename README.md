# scriptlint

Script and package command linting for local project hygiene.

## Status

This repository is an early-stage, local-first CLI scaffold for script and package-command linting. It currently ships a minimal `scriptlint` command with help/version output, fixture-backed CLI tests, and release hygiene checks. Treat it as pre-1.0: useful for validating the package surface, but not yet a full script analysis engine.

## Install

Install dependencies before running the local CLI or verification checks:

```sh
npm install
```

## Use

Run the current CLI scaffold directly from the repo:

```sh
node src/index.js --help
node src/index.js --version
```

After installation as a package, the exposed binary is:

```sh
scriptlint --help
scriptlint --version
```

See `docs/PRD.md` and `ROADMAP.md` for the planned linting rules and package-command analysis scope.

## Verify

Run the available repository checks before opening a pull request:

```sh
npm test
npm run build
npm run smoke
npm run package:smoke
npm run release:check
```

Run the metadata and package-surface audit on its own when changing
`package.json`, workflows, or packed files:

```sh
npm run release:readiness
```

## Limitations

- The CLI currently exposes only help and version commands.
- Script analysis rules and package-command checks are still planned work.
- Security and production posture should be reassessed after the first implementation lands.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## License

MIT
