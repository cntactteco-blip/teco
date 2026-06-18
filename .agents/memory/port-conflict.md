---
name: Migration-backup port conflict
description: .migration-backup workflow always starts first and claims port 24182
---
## Rule
The `.migration-backup: web` workflow is managed by an artifact and CANNOT be reconfigured or deleted. It always starts before `artifacts/teco-md: web` and claims port 24182. The main teco-md workflow will show as FAILED but the app IS accessible and HMR works via the migration-backup.

**Why:** Both workflows run `pnpm --filter @workspace/teco-md run dev` and both get PORT=24182. Migration-backup starts first.

**How to apply:** Don't panic when teco-md workflow shows failed. The app is served correctly. To temporarily fix: `fuser -k 24182/tcp` then restart the main workflow — but migration-backup will reclaim it eventually.
