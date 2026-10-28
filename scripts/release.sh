#!/usr/bin/env bash
set -euo pipefail

BUMP="${1:-patch}"

uv version --bump "$BUMP"
uv lock
NEW_VERSION=$(uv version | awk '{print $NF}')

(cd ui && yarn version --new-version "$NEW_VERSION" --no-git-tag-version)

git add pyproject.toml uv.lock ui/package.json
git commit -m "chore(release): v${NEW_VERSION}"
git tag "v${NEW_VERSION}"
git push origin "v${NEW_VERSION}"
