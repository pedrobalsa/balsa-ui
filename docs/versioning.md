# Versioning and status

Component specifications use semantic versions independently from the repository application version. Initial registry items are `0.1.0` and `beta`: usable for evaluation, but not promised stable.

- `experimental`: incomplete or actively exploring the API.
- `beta`: reviewed enough for use, with known changes or accessibility work possible.
- `stable`: tested, documented, and governed by compatibility expectations.
- `deprecated`: retained temporarily with a migration path.

Any public behavior change updates its specification, registry metadata when relevant, tests, documentation, and `CHANGELOG.md`. Breaking changes require a major component version after stability; before 1.0 they still require explicit migration notes.
