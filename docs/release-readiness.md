# Release readiness

Use this checklist before cutting a release or asking for a release review.

## Local verification

```sh
npm ci
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
directory, verifies the packed manifest, and confirms the installed CLI reads
its version from that manifest. An ordinary `npm version` bump therefore has a
single source of truth; no CLI version literal needs a matching manual edit.

The release workflows independently pack exactly one tarball and capture its
filename. A pull request dry run passes that tarball to `npm publish --dry-run
--access public`. A version tag passes the same captured tarball to
`npm publish --access public --provenance` and attaches it to the GitHub release,
so npm and GitHub receive the artifact that was actually verified.

CI and both release workflows use `npm ci` with the committed lockfile. Keep
`package-lock.json` synchronized with `package.json`; mutable install fallbacks
are intentionally rejected by the release-readiness checks.

## Notes

- Keep README examples aligned with the fixture-backed smoke command.
- Do not publish until CI is green on the release branch.
- Update CHANGELOG.md with user-facing changes before tagging.
