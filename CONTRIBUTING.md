# Contributing

Keep BrandiQue entirely client-side and free of account requirements, paid services, telemetry, and document databases. LocalStorage recovery is permitted; preserve quota handling and downloadable backups. Use existing Fabric commands and Zustand state for new controls.

1. Install with `npm ci` using Node 22 or later.
2. Make focused changes, preserving import/export compatibility.
3. Add regression checks for state-changing behavior where appropriate.
4. Run `npm test` and `npm run build`.
5. Open a pull request explaining the behavior and validation.

Please do not commit user artwork, browser storage, secrets, node_modules, or build output. If the serialized document schema changes, explicitly migrate earlier supported versions.
