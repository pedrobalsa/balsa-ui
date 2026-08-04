# FileUploadCard

Drag-and-drop import target with format guidance and browse action. It follows the shared Balsa application-composition grammar and uses ApplicationCard as its only principal surface. Install it with \`npx balsa-ui@latest add file-upload-card\`.

The active Balsa theme owns material, radius, border, shadow, density, typography, and motion. The composition accepts \`theme?: ThemeInput\` and \`shadow?: Shadow\` for deliberate local overrides; leave them unset to inherit the nearest design context.

Pattern research: [Spectrum Dropzone](https://opensource.adobe.com/spectrum-web-components/components/dropzone/). Canonical source: \`src/components/compositions/FileUploadCard.vue\`; contract: \`specs/components/file-upload-card.json\`.
