# Attachment

Attachment selects local files through a real labelled input, validates type, size, and count, and displays immutable selected-file metadata with accessible removal. Network uploading remains consumer-owned.

Use Attachment to prepare one or more local files for a consumer-owned upload workflow. Avoid it for remote-file browsing, automatic network transfer, or passive file metadata. Loading blocks interaction while preserving the selection; explicit unvalidated and rejection messages remain associated with the native input.

Install with `npx balsa-ui@latest add attachment`. Canonical source: `src/components/ui/Attachment.vue`; interactive documentation: `/docs/components/attachment`; contract: `specs/components/attachment.json`.
