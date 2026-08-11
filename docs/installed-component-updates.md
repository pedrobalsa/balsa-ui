# Installed source updates

`.balsa/installed.json` records registry identity, installed version, source hash, and target paths. It is provenance data, not permission to overwrite source.

`balsa diff` compares the originally installed source, the current registry source,
and the application's editable copy before proposing a change:

- **Unchanged:** neither the registry nor the application copy changed.
- **Upstream:** the registry changed and the application copy did not.
- **Local:** the application copy changed and the registry did not.
- **Diverged:** both copies changed from the installed source.
- **Missing:** a recorded application file no longer exists.

Inspect one item or the complete installation without writing source:

```sh
npx balsa-ui@latest diff
npx balsa-ui@latest diff button
```

`balsa update` applies upstream-only changes and restores missing recorded files. It
preserves local and diverged files, reporting each skipped path. Use `--force` only
after reviewing the diff and explicitly choosing to replace application-owned source:

```sh
npx balsa-ui@latest update button
npx balsa-ui@latest update button --force
```

Unknown provenance is never inferred. Install or adopt source deliberately before
asking the lifecycle commands to manage it.
