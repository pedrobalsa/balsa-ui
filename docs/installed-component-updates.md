# Installed source updates

`.balsa/installed.json` records registry identity, installed version, source hash, and target paths. It is provenance data, not permission to overwrite source.

A future updater must classify each file before proposing a change:

- **Unmodified:** current hash equals the installed hash; an exact or three-way update may be offered.
- **Locally customized:** current hash differs; preserve it and generate a diff or merge proposal.
- **Breaking registry change:** require migration notes and explicit confirmation regardless of local state.
- **Token migration:** report semantic token changes separately from component code.
- **Unknown provenance:** never infer ownership or overwrite; allow adoption only after explicit review.

The current installer has no automatic updater. It refuses differing existing files unless `--force` is deliberately supplied. Generated starter and smoke-fixture synchronization use `--force` only because those repository copies are declared generated artifacts.
