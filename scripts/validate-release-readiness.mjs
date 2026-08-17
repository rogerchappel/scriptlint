import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packagePath = process.env.RELEASE_READINESS_PACKAGE_PATH
  ? path.resolve(process.env.RELEASE_READINESS_PACKAGE_PATH)
  : path.join(root, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts ?? {};
const failures = [];

function requireField(condition, message) {
  if (!condition) failures.push(message);
}

requireField(packageJson.repository, 'package.json must declare repository metadata');
requireField(packageJson.name !== 'scriptlint', 'package.json must not use the third-party unscoped scriptlint identity');
requireField(packageJson.name === '@rogerchappel/scriptlint', 'package.json must use the owner-scoped @rogerchappel/scriptlint identity');
requireField(packageJson.bin?.scriptlint === './src/index.js', 'package.json must preserve the scriptlint CLI mapping');
requireField(packageJson.publishConfig?.access === 'public', 'scoped package must publish with public access');
requireField(Array.isArray(packageJson.files) && packageJson.files.length > 0, 'package.json must declare a non-empty files allowlist');
requireField(scripts['package:smoke'], 'package.json scripts must include package:smoke');
requireField(scripts['release:check'], 'package.json scripts must include release:check');

const workflowDir = process.env.RELEASE_READINESS_WORKFLOW_DIR
  ? path.resolve(process.env.RELEASE_READINESS_WORKFLOW_DIR)
  : path.join(root, '.github', 'workflows');
if (fs.existsSync(workflowDir)) {
  const workflowFiles = fs.readdirSync(workflowDir).filter((file) => /\.ya?ml$/.test(file));
  requireField(workflowFiles.length > 0, 'repository must include at least one workflow file');

  for (const file of workflowFiles) {
    const workflow = fs.readFileSync(path.join(workflowDir, file), 'utf8');
    requireField(!/TODO|FIXME|template becomes an app|customization TODO/i.test(workflow), `.github/workflows/${file} still contains placeholder text`);
  }

  const combined = workflowFiles.map((file) => fs.readFileSync(path.join(workflowDir, file), 'utf8')).join('\n');
  requireField(/release:check/.test(combined), 'CI workflows must run npm run release:check');

  const releasePath = path.join(workflowDir, 'release.yml');
  const dryRunPath = path.join(workflowDir, 'release-dry-run.yml');
  requireField(fs.existsSync(releasePath), 'release workflow must exist');
  requireField(fs.existsSync(dryRunPath), 'release dry-run workflow must exist');

  if (fs.existsSync(releasePath)) {
    validateArtifactHandoff(fs.readFileSync(releasePath, 'utf8'), 'release workflow', {
      publishFlags: '--access public --provenance',
      githubRelease: true,
    });
  }
  if (fs.existsSync(dryRunPath)) {
    validateArtifactHandoff(fs.readFileSync(dryRunPath, 'utf8'), 'release dry-run workflow', {
      publishFlags: '--dry-run --access public',
      githubRelease: false,
    });
  }
}

function validateArtifactHandoff(workflow, label, { publishFlags, githubRelease }) {
  requireField(/node-version:\s*22\b/.test(workflow), `${label} must use Node 22`);
  requireField(/NPM_VERSION:\s*(?:['"])?11\.5\.1(?:['"])?\s*$/m.test(workflow), `${label} must select npm 11.5.1 or later for trusted publishing`);
  requireField(/npm install --global ["']npm@\$NPM_VERSION["']/.test(workflow), `${label} must install the selected trusted-publishing npm version`);
  requireField(/npm --version/.test(workflow), `${label} must log the selected npm version`);

  const packCommands = workflow.match(/\bnpm pack\b/g) ?? [];
  requireField(packCommands.length === 1, `${label} must run npm pack exactly once`);
  requireField(/id:\s*pack\b/.test(workflow), `${label} pack step must have the pack id`);
  requireField(/GITHUB_OUTPUT/.test(workflow), `${label} must capture the packed tarball as an output`);

  const artifact = '\\"\\$\\{\\{ steps\\.pack\\.outputs\\.tarball \\}\\}\\"';
  const publish = new RegExp(`npm publish ${artifact} ${publishFlags.replaceAll(' ', '\\s+')}`);
  requireField(publish.test(workflow), `${label} must publish the captured tarball with ${publishFlags}`);

  if (githubRelease) {
    const release = new RegExp(`gh release create[^\\n]*${artifact}`);
    requireField(release.test(workflow), `${label} must attach the captured tarball to the GitHub release`);
  }
}

if (failures.length > 0) {
  console.error('Release readiness validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Release readiness validation passed.');
