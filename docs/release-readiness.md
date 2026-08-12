# Release readiness

Use this checklist before cutting a release or asking for a release review.

## Local verification

```sh
npm install
npm run test
npm run smoke
npm run release:readiness
npm run package:smoke
npm run release:check
```

## Package contents

`npm run release:readiness` verifies the owner-scoped package identity and the
intentional `scriptlint` binary mapping without contacting the npm registry.
`npm run package:smoke` packs the project, installs that tarball in a temporary
directory, verifies the packed manifest, and runs the installed CLI.

## Notes

- Keep README examples aligned with the fixture-backed smoke command.
- Do not publish until CI is green on the release branch.
- Update CHANGELOG.md with user-facing changes before tagging.
