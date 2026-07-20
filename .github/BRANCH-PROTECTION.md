# Branch Protection (RC-3)

Configure these rules in GitHub **Settings → Branches → Branch protection rules** for `main`:

## Required settings

- Require a pull request before merging
- Require approvals: **1+**
- Dismiss stale pull request approvals when new commits are pushed
- Require status checks to pass before merging
- Require branches to be up to date before merging (recommended)
- Do not allow bypassing the above settings (except emergency admins)

## Required status checks

Map to workflow job names:

| Workflow                       | Required check name |
| ------------------------------ | ------------------- |
| Pull Request Validation        | `PR Validation`     |
| Continuous Integration         | `CI`                |
| Security Scan (optional on PR) | `Security`          |

Exact check names appear in the Actions UI after the first successful run; update this table if GitHub renames them.

## Policy

- No direct pushes to `main`
- Merge only after CI + PR validation PASS
- Release tags (`v*`) are created locally by `pnpm release:rc` (on PASS) and pushed manually
- GitHub Release is created by `.github/workflows/release.yml` on tag push

## Notifications

Integration points for Slack / Discord / Teams / Email can be added as workflow steps using repository secrets. Notification delivery is intentionally disabled by default.
