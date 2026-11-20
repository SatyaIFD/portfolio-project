# Hurdle 001: GitHub CLI Remote Exists Error

**Symptom:** `gh repo create` failed with `X Unable to add remote "origin"`.
**Root Cause:** The remote `origin` was already added manually in a previous step, causing a conflict when `gh` tried to attach it again.
**Resolution:** The repository was still successfully created on GitHub. Manually running `git push -u origin main` resolved the sync.
