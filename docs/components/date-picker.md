# DatePicker

DatePicker composes Calendar inside Popup behind a labelled locale-formatted field with single/range models, validation, disabled dates, clear action, collision handling, dismissal, and focus restoration. The visible label, required state, invalid state, and error message are attached directly to the trigger; an optional `name` submits stable local ISO date values instead of localized display copy. In Glassmorphism, the calendar popup uses the theme's translucent material with backdrop blur.

Use DatePicker for date-only form values and ranges. Use Calendar for an always-visible grid, and avoid DatePicker for time selection, free-text parsing, or timezone conversion. Install with `npx balsa-ui@latest add date-picker`.

Canonical source: `src/components/ui/DatePicker.vue`; interactive documentation: `/docs/components/date-picker`; contract: `specs/components/date-picker.json`.
