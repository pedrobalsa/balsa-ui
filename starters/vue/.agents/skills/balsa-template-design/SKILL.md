---
name: balsa-template-design
description: Create distinctive, production-ready Balsa UI templates, blocks, showcases, demos, and visually led Vue surfaces without generic AI-template aesthetics. Use with the balsa-ui skill when generating a new page-level composition, beautifying a Balsa interface, establishing art direction, or producing a polished one-shot template from a brief or visual reference. Do not use for a small component behavior fix or a public primitive API change.
---

# Design Distinctive Balsa Templates

Use this skill with `$balsa-ui`. This skill owns art direction and composition; `$balsa-ui`
owns discovery, exact component contracts, installation, accessibility, source placement, and
validation. Keep the implementation in Vue 3 `<script setup lang="ts">` and preserve the
active Balsa design system.

## Ground the template in a subject

- Choose one concrete subject, audience, and primary job when the brief leaves them open.
- Build with realistic names, labels, values, states, and domain language. Keep demo content
  specific even when the template API remains reusable.
- Derive visual character from the subject's real materials, tools, artifacts, environment,
  and vernacular. Do not substitute generic SaaS copy or invented vanity metrics.

## Art-direct before coding

Create a compact internal plan before editing:

1. **Thesis** — state the visual idea in one sentence.
2. **Container model** — choose the page structure: open canvas, bands, rails, list, table,
   master-detail, editorial columns, media frame, deliberate Card system, or another model
   justified by the content.
3. **Typography** — assign title, body, control, label, and data roles. Use the active theme's
   roles unless the brief explicitly calls for an authored design system.
4. **Palette and material** — map hierarchy to Balsa semantic tokens and theme-owned
   surfaces. Reserve product-specific color for decoration that need not adapt with the
   palette.
5. **Density and rhythm** — choose controlled density or generous space and repeat a small
   spacing rhythm consistently.
6. **Signature** — choose one memorable, subject-specific compositional move.
7. **Restraint** — name what stays quiet so the signature remains legible.

Use an ASCII wireframe when the hierarchy or container model is not obvious from the brief.
If an attached reference or generated concept is the visual specification, extract this plan
from it and preserve its hierarchy, density, geometry, and media treatment.

## Run the anti-template critique

Before coding, ask whether each major choice could appear unchanged in an unrelated product.
Revise any answer that is merely a model default rather than a decision for this subject.

- Replace default bento grids and repeated three-card rows with a content-appropriate
  container model.
- Replace nested rounded surfaces with one principal surface owner plus spacing, separators,
  bands, rails, lists, or tables.
- Remove decorative pills, eyebrow labels, icon rows, fake metrics, glows, and gradients when
  they do not encode real information or the chosen direction.
- Avoid evenly distributing emphasis. Give the surface one focal point and one obvious
  primary action.
- Make structural devices truthful: numbering indicates a sequence; status styling indicates
  state; grouping expresses a real relationship.
- Spend boldness in the signature element. Refined minimalism requires exact typography,
  alignment, spacing, and detail rather than extra decoration.

State positive replacements in the plan. "Use an open table-and-inspector layout" directs an
agent better than "do not use cards."

## Discover and compose with Balsa

Follow `$balsa-ui` before writing common controls or surfaces:

1. Search by intent and inspect the compact catalog only as a fallback.
2. Read only the selected component specifications.
3. Prefer a matching block, then composition, then primitive.
4. Install selected items before implementation.

Apply the signature at the composition layer. Do not invent primitive variants, raw brand
colors, runtime Tailwind classes, or competing component APIs to force the art direction.
Use one repeated application grammar and let inherited themes own geometry, material, depth,
motion, and typography unless a local exception has semantic purpose.

## Build the complete surface in one pass

- Implement the requested template, not a marketing wrapper around a future interface.
- Preserve one principal surface owner for each region and avoid Card-inside-Card framing.
- Use real interaction state and include the relevant loading, empty, error, selected,
  disabled, overflow, and long-content cases.
- Keep controls semantic, keyboard accessible, visibly focused, and understandable without
  color alone.
- Make the first responsive decision intentional; do not merely shrink the desktop layout.
- Reuse one component or typed variant for repeated anatomy instead of copying one-off markup.

Do the planning and anti-template critique internally, then implement without asking for an
approval round unless the user requests concepts first or a missing choice would materially
change the result.

## Inspect the visible result

Render the template at its intended desktop and mobile sizes when browser tools are available.
Check hierarchy, copy, line breaks, density, container ownership, token use, focus, overflow,
and whether the signature still reads. Remove one nonessential visual accessory, then run the
repository's required validation from `$balsa-ui`.

## Adaptation notice

This file is adapted from Anthropic's `frontend-design` skill and has been substantially
modified for Balsa UI, Vue composition, semantic tokens, component discovery, one-shot
template generation, and Balsa validation. The upstream work is licensed under Apache-2.0;
see `LICENSE.txt` in this skill directory.
