Contribution guidelines

Before opening a PR:

- Run `npm ci` to install exact dependencies.
- Run `npm run check-audit` to detect moderate+ vulnerabilities locally.
- If `npm audit` reports vulnerabilities, open a draft PR that upgrades the affected direct dependency (preferably on a branch named `chore/upgrade-<pkg>`).
- For major version bumps (semver-major), run the app build and basic manual QA locally and document breaking changes in the PR.

CI and automated updates:

- This repository runs a GitHub Actions workflow that will run `npm run check-audit`, build and lint on PRs.
- Dependabot is configured to open PRs for dependency updates daily. Please review and test those PRs, especially major bumps for `next`.

If you need help with an upgrade, ping the maintainers and include failing build logs and steps to reproduce.
