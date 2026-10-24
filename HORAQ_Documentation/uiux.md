Exactly. The problem is not just the colours. The entire component language looks AI-generated: identical rounded cards, coloured top borders, repetitive panels, excessive pills, and layouts where everything has the same visual importance.

We need to patch HORA-Q as a product-design system inspired by Apple's restraint + Google's expressive clarity + our own distinctive cybersecurity identity. Not another generic dashboard reskin.

## HORA-Q — Product Design Patch

[Using NAS with Apple macOS - ASUSTOR NAS](https://images.openai.com/static-rsc-4/evNG1d2qImBQs9VVjDFq8CCuUQod1ueNHtM8BaEuvWewVnosx8ME7i8WV1CII1umLbixkH2DlXOCWaRKsCFobW4evpBN-xqcnTxj8QwLy0iPHo4r5GTiHW8g-clcLE_GC9Wh0vYOhlie1nk8qMz7bb1Bk8l5cmG23HU1nBOStQg?purpose=inline)

1\. Apple — craftsmanship

Natural hierarchy, precise typography, quiet surfaces, deliberate spacing, restrained translucency and dialogs that feel like part of the operating system.

[La caída de características del Google Pixel añade Material 3 Expressive y nuevas funciones al Pixel 6 y modelos posteriores - NotebookCheck.org News](https://images.openai.com/static-rsc-4/h9wwCUhMezE2KKXBpwQs3QVpaNOwBMtfXBI1oFrcYd0yb4cp3dhv9qdAhIZRUVG60U13i76R8KFiaHFi9eJciifdVDOiFfdHKCy9HuubAPvOL6ChybYQ9pRgvZK5k0DcXZFik-7JkJ22IMGCmWkMK0noEXtxYKbTgLEG2h4Od-E?purpose=inline)

2\. Google — expressive clarity

Purposeful colour, clear interaction states, confident typography and components that adapt to their content instead of repeating one template everywhere.

[Nakwagala Edgar Lambert | Web Developer & Cybersecurity Practitioner](https://images.openai.com/static-rsc-4/h5f1-rHd6DYrfeSBHTnD0gHy5lwezEUUEDY3A_4c3A953YN97jRHrGm0uiNMLPKamv0Jit26zLo-X1sIOjPh4U3IqZkv2tYZObrZxQx50Ln4LG1YtO0WFfMg_WwD_miidWxk4MCvdGfh5p9qeeqxM4EZfi84tfl3Wgc4jgw4oWc?purpose=inline)

3\. HORA-Q — technical character

Dense, credible routing intelligence; real incident tables; distinctive evidence inspection; precise data typography; and a calm command-centre atmosphere.

## The actual patch prompt

Use this with your coding agent inside the existing `D:\HORA-Q` project. It explicitly tells the agent to redesign the components and layouts, not simply change CSS colours.

# HORA-Q — PRODUCT-LEVEL UI RECONSTRUCTION PATCH

## Design direction: Apple craftsmanship × Google expressive clarity × original HORA-Q identity

You are modifying the EXISTING HORA-Q application. The current interface looks AI-generated because its components rely on repetitive rounded cards, arbitrary coloured borders, excessive pills, generic empty states, uniform spacing and nested containers.

This is not a colour-refresh task. Reconstruct the visual design language and page composition so the application feels intentionally designed by a senior product-design team.

Do not return a proposal. Inspect the codebase, implement the patch, run the application and validate the rendered pages.

## A. Establish the product identity

Create an original visual language with these influences:

- Apple: restraint, typographic precision, material quality, carefully composed dialogs and polished interactions.
- Google: purposeful colour, expressive but controlled emphasis, excellent interaction feedback and adaptive components.
- HORA-Q: authoritative BGP intelligence, forensic evidence, routing telemetry and serious security operations.

Do not copy either company's interface, branding, proprietary assets or exact layouts. Do not produce a generic shadcn dashboard, a template admin panel or a neon gaming interface.

## B. Eliminate the AI-generated card aesthetic

Remove the assumption that every piece of information belongs in a rounded card.

Audit every page and replace repetitive card grids with the most appropriate information structure:

- Overview: editorial heading, concise monitoring-state indicator, prominent operational summary, compact metric strip and a proper incident ledger.
- Alerts: a strong incident list or table, clear severity hierarchy, useful filtering and meaningful incident details. Use an empty state only when the active filter genuinely has no results.
- Route baselines: a clean, information-dense table on desktop; compact structured rows on mobile. Avoid turning every baseline into an oversized floating card.
- Scenarios: a structured test-suite list with clear expected outcomes, execution state and individual run controls. Do not give every scenario a decorative red top border.
- Audit history: a forensic ledger with timestamp, event, resource, integrity digest and signature state. Hashes should be legible, compact and copyable.
- RPKI inspector: a focused form and a clear result area, with the validation outcome and supporting evidence given appropriate hierarchy.
- Route injection: a practical form with grouped advanced parameters, useful validation and a clear explanation that it injects a test observation rather than changing Internet routing.
- Evidence dialog: a refined forensic inspector, not a stack of identical cards.

Remove redundant wrappers, unnecessary nested panels, decorative accent strips, oversized empty areas, excessive badges and redundant labels. Use borders only when they communicate grouping or separation.

## C. Build a real design system

First inspect the current CSS, component library and existing design tokens. Consolidate them rather than layering another patch on top of conflicting rules.

Use a coherent dark palette:

- Base: deep midnight graphite, not pure black everywhere.
- Main surfaces: subtle tonal differences between canvas, navigation, content and raised dialogs.
- Primary accent: refined azure for primary actions, selection and interactive links.
- Secondary accent: restrained teal for meaningful telemetry emphasis.
- Semantic colours: green for verified/healthy, amber for warning/review and red for actual critical or failed states.
- Text: strong primary contrast, readable secondary text and subdued tertiary metadata.

Use colour to explain information, not decorate every component. Remove the global blue edge glow, excessive box-shadows, rainbow KPI borders and gratuitous gradients.

Establish consistent typography, spacing, radii, icon sizes, focus states and motion. Use the existing icon system consistently. Do not use emoji as interface icons.

Typography should distinguish page titles, section headings, operational values, body copy, metadata and technical identifiers. Use tabular numerals for counts and timestamps, and a suitable monospace treatment for ASNs, CIDRs, hashes and machine-readable identifiers.

## D. Replace generic KPI cards

Do not merely restyle the existing four cards.

Design a compact operational metric system with a clear relationship between:

- Active anomalies
- Prefixes tracked
- Updates evaluated
- Connected peers

Prefer a unified metric row or carefully aligned metric columns, separated through spacing or subtle dividers. Use accent colour sparingly. Each metric must have a clear label, value and concise contextual description.

The metric layout must adapt gracefully to mobile without creating oversized, repetitive tiles.

Never invent sparklines, percentages, trend arrows or historical comparisons when the application does not supply the underlying data.

## E. Redesign the overview composition

Create a deliberate reading sequence:

1. Product page heading and one concise description.
2. A compact live/replay state indicator driven by actual runtime state.
3. A monitoring summary that communicates the real operational condition without consuming an entire screen.
4. A cohesive, compact metric strip.
5. A well-designed recent-incidents ledger with useful details and a clear route to the full incident view.

Avoid multiple competing status pills. Do not repeat "Monitoring active" in three locations when one clear status indicator will do.

At desktop widths, use available space intelligently. Avoid an oversized centred content column surrounded by unnecessary empty space. Preserve comfortable reading widths.

## F. Give the incident interface a real hierarchy

Incidents are the product's core content.

Present the prefix, incident type, observed origin, baseline origin, severity, last-seen time and lifecycle status in a consistent hierarchy. The important anomaly should be immediately identifiable without a row of competing badges.

Use red for actual critical severity, not as a default card accent. Acknowledged and resolved states must remain visually distinct without appearing to be active failures.

Preserve incident grouping, filters, expansion, evidence access and lifecycle actions. Empty states must reflect the actual selected filter and backend response.

## G. Reconstruct the evidence inspector

Treat cryptographic evidence as a specialised forensic workspace.

The dialog should have:

- A compact, well-composed header with evidence ID.
- A concise associated-incident summary.
- Clearly distinguished integrity verification and digital-signature states.
- A logically grouped forensic action area.
- A collapsible technical section containing the canonical payload and full digest.
- Copy and export actions that fit cleanly without awkward wrapping.

Display shortened hashes in summary views and preserve access to full hashes. On narrow screens, stack controls intentionally rather than letting buttons wrap unpredictably.

Keep the distinction between a valid content-integrity digest and an applied digital signature. A recorded SHA-256 digest does not mean that a digital signature exists.

The tamper demonstration must continue to show the actual verification result and mutation state. Never hardcode a successful verification result.

## H. Correct visual semantics and inconsistencies

A clean baseline seeding scenario expecting zero alerts must not look like a critical failure. Semantic colours must represent actual state, not be selected as decoration.

Distinguish live RIPE RIS collection, replay mode and synthetic demo observations according to the actual application state. Do not claim live monitoring merely because the backend is running.

Ensure the same incident has consistent status, severity and origin data throughout Overview, Alerts, Audit History and Evidence.

Preserve all real backend-derived values. Do not manufacture connected-peer counts, monitoring results, verification outcomes or RPKI statuses.

## I. Interaction and responsive quality

Keep all existing routes and working functionality. Verify:

- Sidebar navigation and mobile navigation.
- Search and incident filters.
- Scenario execution and expected outcomes.
- Baseline filtering and RPKI checks.
- Test-observation submission and validation.
- Evidence opening, integrity verification, tamper simulation, reset, signing and export.
- Theme switching and settings.
- Empty, loading, error and success states.

Use subtle, purposeful transitions. Respect reduced-motion preferences. Make keyboard focus visible and ensure adequate contrast.

At mobile widths, redesign the composition rather than merely shrinking desktop components. Prevent horizontal overflow, clipped dialogs, overlapping controls and broken tables.

## J. Implementation constraints

Before editing:

1. Inspect the actual frontend framework, existing components, CSS, routes and package scripts.
2. Identify the current design tokens and conflicting styles.
3. Map each page to its existing data sources and interactions.

Implement shared reusable primitives where useful, but do not force every page into the same component template.

Do not rewrite backend logic, detection rules, database schemas or API contracts for visual reasons. Do not remove functional features to make screenshots simpler. Do not fabricate data. Do not introduce an unnecessary UI framework or a large dependency merely to achieve the design.

After editing:

1. Run the frontend production build.
2. Run relevant regression tests.
3. Launch the actual application.
4. Inspect screenshots of every page at desktop and mobile widths.
5. Correct visual defects discovered in the screenshots.
6. Report files changed, checks actually executed, any failures and any functionality not verified.

Acceptance criterion: the finished application must no longer look like a generic AI-generated card dashboard. Its composition, typography, information hierarchy, data density, controls and details must all express a coherent premium product identity.

Implement the changes directly in the current project. Do not stop after changing the palette or producing a design specification.

My strongest recommendation: judge the next version by the Overview, Alerts and Evidence inspector together. If all three still look like the same card template with different content, the patch has failed—even if the colours are beautiful.