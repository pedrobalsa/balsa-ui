# Input OTP

Input OTP collects a fixed-length numeric or alphanumeric verification code through one native input and a row of visual cells. The one logical field owns label, name, autocomplete, required, invalid, busy, paste, editing, and form behavior; decorative cells and separators do not create repeated Tab stops or ambiguous accessible names.

Length is safely clamped from four through ten. Grouping is off by default; set `grouped` to add a visual separator after every three cells, or use `separatorEvery` for an explicit cadence. Optional masking and separators change only the visual output. The row scrolls horizontally when a narrow viewport cannot fit every cell, emits `complete` when normalized input reaches its target length, and supports `surface`, `outline`, `soft`, `solid`, and `glass` cell materials. Its `color` accepts every `SemanticColor` role and defaults to `primary`; validation feedback takes priority when present. It also inherits Balsa's shared `sm`/`md`, `Rounded`, hint, loading, and validation language. Install with `npx balsa-ui@latest add input-otp`.

Canonical source: `src/components/ui/InputOTP.vue`; interactive documentation: `/docs/components/input-otp`; contract: `specs/components/input-otp.json`.
