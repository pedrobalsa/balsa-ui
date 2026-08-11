# Analytics

Analytics is Balsa's optional provider-neutral interaction layer. Install it with `npx balsa-ui@latest add analytics`, then register one controller with the Vue application or wrap the application in `BalsaAnalyticsProvider`. A single delegated listener observes interactive descendants of the `data-balsa` hooks already published by every Balsa component, so components do not import GA4, Meta, LinkedIn, or another analytics SDK.

Each successful Balsa interaction emits `balsa_interaction` with only structural metadata: `balsa_component`, `balsa_component_path`, and `balsa_action`. It never reads visible text, input values, link destinations, or element ids. A Button with `analytics-event="cta"` emits the automatic interaction and a second `cta` event.

## Configure Google Analytics 4

Install the [official Google tag](https://developers.google.com/tag-platform/gtagjs) once in the application shell. Replace the placeholder with the GA4 web stream measurement id. If Google Tag Manager or another bootstrap already creates `window.gtag`, keep that setup and do not install a second tag.

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  gtag("js", new Date());
  gtag("config", "G-XXXXXXXXXX");
</script>
```

The Google tag belongs to the application, not the Balsa item. This keeps script loading, consent mode, disclosure, and destination configuration under application control.

## Register GA4 once

```ts
import { createApp } from "vue";
import App from "./App.vue";
import {
  createBalsaAnalytics,
  createGoogleAnalyticsAdapter,
} from "@/components/ui/analytics";

const analytics = createBalsaAnalytics({
  enabled: () => consentStore.analytics,
  adapters: [createGoogleAnalyticsAdapter({ sendTo: "G-XXXXXXXXXX" })],
});

createApp(App).use(analytics).mount("#app");
```

The adapter uses the existing global `gtag` function at event time. It does not load the vendor script, create identifiers, or configure consent. Bind `enabled` to the application's consent decision. `sendTo` is optional for a page with one Google destination, but making it explicit prevents ambiguity when several destinations share the tag.

## Automatic events

No component-by-component wiring is required. The installed controller observes Balsa's existing `data-balsa` roots and forwards structural clicks, changes, and submissions:

```ts
// Equivalent GA4 payload after clicking a Button inside a Card
gtag("event", "balsa_interaction", {
  balsa_component: "button",
  balsa_component_path: "button>card",
  balsa_action: "click",
  send_to: "G-XXXXXXXXXX",
});
```

GA4 event names are normalized to lowercase underscores and its 40-character limit.

LinkedIn differs from event-oriented analytics: its browser tag records event-specific conversions by conversion id. The LinkedIn adapter therefore ignores every event that is not present in `conversions`; do not map `balsa_interaction` as a blanket conversion.

## Custom events

```vue
<Button analytics-event="cta">Start free trial</Button>
```

The typed Button prop writes the provider-neutral `data-balsa-track` hook. Existing or application-owned interactive markup may use that data attribute directly. For events that are not DOM interactions, inject the controller with `useBalsaAnalytics()` and call `track("checkout_complete", { plan: "team" })`.

```vue
<script setup lang="ts">
import { useBalsaAnalytics } from "@/components/ui/analytics";

const analytics = useBalsaAnalytics();

function confirmCheckout(): void {
  analytics.track("checkout_complete", { plan: "team" });
}
</script>

<template>
  <Button @click="confirmCheckout">Confirm checkout</Button>
</template>
```

## Meta, LinkedIn, and custom adapters

```ts
const analytics = createBalsaAnalytics({
  enabled: () => consentStore.analytics,
  adapters: [
    createMetaPixelAdapter({ standardEvents: ["Lead", "Purchase"] }),
    createLinkedInInsightTagAdapter({
      conversions: { lead: 123456, purchase: 789012 },
    }),
    createAnalyticsAdapter("first-party", (event) => {
      navigator.sendBeacon("/analytics", JSON.stringify(event));
    }),
  ],
});
```

Use `context` for non-sensitive application-wide dimensions and `transform` to enrich, rename, filter, or return `null` for an event. Adapter failures are isolated from the interaction and can be observed through `onError`.

## Privacy and consent

Automatic tracking is intentionally structural. Application code can add arbitrary properties through `track`, `context`, or `transform`, so the application owns review of those values. Do not send form contents, email addresses, health or financial details, authentication data, or unredacted URLs. Disable the controller until the applicable consent signal permits each configured destination.

GA4 receives event names normalized to its lowercase underscore convention and 40-character limit. Meta events use `trackCustom` unless their exact name is listed in `standardEvents`. LinkedIn receives only an explicitly mapped conversion id. Use a custom adapter for PostHog, Segment, a first-party endpoint, or another destination.
