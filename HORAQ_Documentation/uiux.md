You're right. I interpreted “Google + Apple” as minimalism, and that pushed HORA-Q too far toward a plain, monochrome enterprise dashboard. That's not the product identity you're asking for.

You want HORA-Q to feel like a premium, carefully art-directed product: rich colour, beautifully layered surfaces, distinctive controls, confident typography and a memorable visual identity—while still being a serious cybersecurity tool.

## The correct design direction: expressive colour + premium depth

The research supports this direction. Google's Material 3 Expressive deliberately uses colour, shape, size, motion and containment to create a more distinctive interface and draw attention to important actions. Apple's interface guidance uses layered materials for depth and reserves strong colour for meaningful emphasis. The combination is more interesting than simply making everything grey and adding blue buttons.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://design.google\&sz=32)

Google Design

+2



For HORA-Q, I recommend a bespoke visual direction called Aurora Obsidian: deep midnight surfaces, electric blue and indigo accents, a controlled teal highlight, rich semantic status colours and subtle ambient lighting. This is a proposed design direction for your product, not an official Apple or Google theme.

## Copy-paste prompt for your coding agent

# HORA-Q — AURORA OBSIDIAN

## Premium Product Visual Redesign: Google × Apple Design Philosophy

### Your role

Act as a world-class product design director, visual design specialist and senior frontend engineer.

Your task is to elevate the EXISTING HORA-Q application into a distinctive, premium, visually expressive cybersecurity product. Draw inspiration from the visual refinement and depth of Apple products and the expressive colour, familiar interaction patterns and clarity of Google's Material Design.

Do not copy either company's interface. Establish an original design identity that belongs to HORA-Q.

## 1. THE MOST IMPORTANT REQUIREMENT

The previous redesign became too plain, too monochromatic and too minimal.

**DO NOT SIMPLIFY THE VISUAL DESIGN FURTHER. DO NOT REMOVE CARDS JUST TO MAKE THE INTERFACE LOOK MINIMAL.**

The application now has a better information architecture, more understandable labels, grouped incidents and expandable technical evidence. Preserve those improvements.

What needs to change now is the product's visual personality.

The current design uses too many similar charcoal surfaces, muted gray cards and isolated cyan buttons. It lacks a distinctive colour system, visual richness, intentional lighting and the polished sense of depth found in exceptional consumer products.

Make the interface feel:

- Premium and deliberately art-directed.
- Rich in colour without becoming chaotic.
- Technical and credible without feeling sterile.
- Modern and expressive without resembling a gaming dashboard.
- Sophisticated enough for a cybersecurity evaluator.
- Beautiful at first sight, with every visual element serving a purpose.

The desired balance is approximately **Apple's refinement and material depth + Google's expressive colour and interaction design + the precision of a professional security product**.

This is a visual identity redesign, not a new application.

## 2. Establish HORA-Q's signature colour identity

Use the art direction "Aurora Obsidian".

The foundation is deep midnight blue rather than pure black or generic gray. Introduce layered navy surfaces, subtle colour transitions and carefully placed blue, indigo and teal accents.

Use the following as initial design tokens and refine them through browser rendering.

### Dark theme

- App canvas: #0B1019
- Navigation surface: #101724
- Primary content surface: #151E2C
- Elevated surface: #1C2737
- Interactive surface: #243349
- Divider: #2D3B4F
- Primary text: #F4F7FF
- Secondary text: #B0BCD0
- Muted metadata: #8795AD
- Primary action / focus: #62A8FF
- Secondary accent: #A49AFF
- Tertiary accent: #4CD9CF
- Success: #43D99B
- Warning: #F5BE56
- Critical: #FF7185
- Informational: #72B9FF

These values are starting points, not unchangeable rules. Validate all foreground/background combinations for readability.

### Use colour with intention

The colour system must appear throughout the product, not just on buttons.

- Use electric blue for primary navigation emphasis, links, focus states and primary actions.
- Use indigo sparingly for advanced analysis and technical or cryptographic contexts when it has a clear purpose.
- Use teal for supporting information, selected secondary indicators and appropriate network-related visualizations.
- Use green for verified success and healthy states.
- Use amber for pending review or caution.
- Use coral-red for actual critical alerts and integrity failures.

Do not make every element colorful. Build contrast between expressive highlights and carefully controlled neutral surfaces.

### Avoid the previous mistakes

- No large areas of pure black that disconnect from the rest of the interface.
- No endless identical gray cards.
- No neon outlines on every component.
- No massive electric-blue glow around the entire screen.
- No random gradients that have nothing to do with application state.
- No green styling for a condition that has not been verified.
- No bright red styling for resolved incidents.
- No rainbow-coloured interface.

The interface should feel rich and luminous, not oversaturated.

## 3. Create visual depth, not flat monochrome surfaces

Use an intentional three-level surface hierarchy:

1. A deep midnight application canvas.
2. Navy-tinted content surfaces with subtle separation.
3. Elevated layers for dialogs, menus, selected controls and other genuinely foreground elements.

Allow different pages to have subtle tonal personalities while preserving a coherent design system.

For example, the Overview can have a restrained blue-to-indigo ambient treatment behind its primary monitoring area. The evidence dialog can use a slightly elevated blue-gray surface with refined separation from its backdrop. The navigation may have restrained translucency or a material-like treatment where it improves hierarchy.

Keep content surfaces sufficiently opaque for legibility. Do not put blur and transparency on every card.

Use localized ambient lighting and restrained gradients behind important areas—not a bright, continuous frame around the entire screen.

Shadows should provide depth and separation. Avoid large, blurry shadows that dominate the layout.

## 4. Give HORA-Q a distinctive product identity

The current design looks like a generic dashboard that could belong to any application. Give it recognisable product-specific details.

### Navigation

- Retain the current logical navigation groups and working routes.
- Give the HORA-Q brand a refined typographic treatment.
- Add subtle colour identity to navigation icons and active states.
- Use a tinted, layered selected-item background with a clear accent indicator.
- Keep inactive icons restrained and legible.
- Keep the sidebar distinct from the main content without a heavy separator.
- Avoid oversized logo treatments and excessive decoration.

### Top toolbar

Polish the toolbar with a refined surface, consistent control dimensions and meaningful state indicators.

The monitoring state should have a subtle coloured indicator and a readable label. Search, appearance and notification controls should feel designed as one family.

If a floating or translucent toolbar treatment is used, ensure it does not compromise readability or resemble a bright glass strip.

### Buttons and controls

Use an intentional visual hierarchy:

- Primary actions: confidently coloured blue or blue-gradient backgrounds where appropriate.
- Secondary actions: tonal navy surfaces and restrained borders.
- Tertiary actions: clean text buttons with clear hover and focus states.
- Destructive actions: semantic warning/error treatment.
- Selected filters: visibly selected tinted surfaces rather than indistinguishable gray pills.

Do not give every button a coloured fill. Save the strongest emphasis for the most important action.

Use consistent hover, pressed, focus, disabled, loading and success states. Motion should be subtle, fast and purposeful.

## 5. Make the dashboard feel like a premium security product

### Overview

Retain the clear structure from the current redesign.

Enhance its appearance using a refined status banner, deliberate accent placement and sophisticated metric presentation.

Metric tiles may use subtle individual tonal variations or a small accent edge to create distinction. Keep the numbers and labels readable.

Use chart or trend visualizations only if meaningful underlying data exists. Never invent sparklines, percentages or trends.

The monitoring-status area should feel confident and polished rather than empty or overly dramatic.

### Alerts

Keep the existing grouped-incident model and filters.

Introduce a more expressive severity system, clear incident grouping and refined interaction states. The severity label, affected prefix and observed-versus-baseline comparison must remain immediately readable.

Use colour to direct attention to the actual severity, not to turn each incident row into a red or neon panel.

Keep acknowledged and resolved incidents visually distinct from active incidents.

### Evidence and cryptographic verification

Give the evidence dialog a polished, layered foreground treatment.

Use the colour system to distinguish:

- Integrity recorded or verified.
- Integrity mismatch.
- Signature valid.
- Unsigned or unavailable.
- Simulated tampering.

Keep integrity status and digital-signature status separate.

Make verification results visually meaningful without presenting a hash as proof of authenticity. Never indicate that signing succeeded unless the operation actually succeeded.

Preserve the advanced-details disclosure and raw evidence access.

### Route baselines and audit history

Use clean, carefully aligned data tables with subtle tonal hover states, readable technical typography and consistent focus treatment.

Use blue and teal selectively to distinguish route values and interactive metadata.

Keep full hashes available while displaying readable shortened representations where appropriate.

### Scenarios

Give the scenario workspace a little more visual character through refined scenario markers, subtle tonal differentiation and distinct primary execution controls.

Keep advanced technical criteria behind the existing disclosure controls.

Do not remove useful information to make the page sparse.

### RPKI inspector and manual route test

Keep both workflows straightforward, but visually elevate the forms with refined field backgrounds, clear labels, visible focus states and intentional button hierarchy.

Use distinct, understandable result states for valid, invalid and unavailable checks.

Do not represent preset values as successful live results.

### Settings

Preserve the existing sections and controls. Improve theme previews so Dark, Light and System appear as polished, selectable theme choices rather than three unrelated boxes.

Keep system health, appearance settings and technical information visually connected through shared design tokens.

## 6. Develop a complete light theme too

The Light theme must have its own considered colour palette, not simply invert the dark theme.

Use warm-white or softly tinted neutral surfaces, blue/indigo accents and the same consistent semantic status colours.

Ensure both themes share:

- The same spacing and typography.
- The same component hierarchy.
- The same meaning for status colours.
- Consistent active-navigation and focus states.
- Equivalent readability and contrast.

Preserve the existing theme-selection behavior and inspect whether the current System option genuinely follows system preference.

## 7. Design quality requirements

Apply colour, typography, shape and depth in a coordinated way.

Use a consistent font scale, strong page titles, refined body copy, legible metadata and monospaced technical values.

Use carefully chosen corner radii, consistent control heights, predictable spacing and aligned edges. Do not use excessive rounding on every surface.

Add subtle transitions for navigation selection, dialog entry, status changes and hover states. Respect reduced-motion preferences.

Use an existing icon set consistently. Avoid mixing multiple icon styles.

Maintain keyboard accessibility and WCAG 2.2 AA text contrast where applicable.

Do not introduce unnecessary new dependencies, external font requirements or decorative graphics.

## 8. Work in the existing source code

First inspect the actual frontend, global stylesheet, theme definitions, shared components, component variants and responsive behavior.

Identify the source of the current colour tokens and global background effects.

Implement the new design system in the existing application instead of adding another parallel stylesheet or applying scattered CSS overrides.

Preserve all functionality, API calls, database records, routing, alert grouping, baseline rules, scenario execution, RPKI checks, evidence generation, cryptographic verification and existing navigation.

Do not change backend logic simply to improve presentation.

Do not hardcode metrics, monitoring states, signatures, validation results or system-health labels.

After implementation, inspect all ten supplied screenshots against the rendered result.

Capture fresh screenshots of the Overview, Alerts, Evidence modal, tamper-verification state, Baselines, Scenarios, Audit history, RPKI inspector, route-test form and Settings.

Check both dark and light themes and verify that responsive layouts remain usable.

Run the existing frontend type-check, production build and relevant tests. Report actual results.

## Acceptance standard

The finished product should no longer look like a flat, monochrome dashboard.

It should have a recognisable HORA-Q visual identity, expressive but disciplined colour, premium material depth, confident typography, purposeful interaction states and a coherent look across every page.

It must preserve the improved information architecture without becoming either oversimplified or visually cluttered.

**Do not mistake minimalism for quality. Deliver colour, depth, refinement and personality while maintaining technical clarity.**

Implement the redesign directly in the existing project. Do not stop after creating a design proposal or changing a handful of CSS variables.

## The visual reference to keep in mind

[Supporting Dark Mode in your interface | Apple Developer Documentation](https://images.openai.com/static-rsc-4/r4tzDgG92VvzE9GbDYX7Mr9f9KjITgyIs5q37sAtt81vabOqwJCWFRnVmzuIq4I84iEcI1ZdwS7JbbPCGXQydMJq5gKAcE-yy8QHDe6Ytm6McFcUAzo31ElL7LFNasmtkpV7qwSqnoNTRPcfn0U1Au8c-iu-D_QQmTPHSnhgbJY?purpose=inline)

Apple-inspired refinement

Layered surfaces, considered spacing, controlled lighting and elegant foreground controls.

[Adiós al gris: Android 16 prueba un rediseño con íconos coloridos en los ajustes](https://images.openai.com/static-rsc-4/6Pc6j12ghiqW8uLs3BreQYIaiGt2POzuQGUkzrHoWTnG8LVDlL77gjRP7_M9GZvWfGSbMIikymfTpI1nMvtadmmbXtffqrf5GJUhqlQX6AXWOwyf3H7LzZCq4w3o1pp2ey-ETepY5pGx_eimXSGYp5FLYHXOVYp2rW3hJk3kQhU?purpose=inline)

Google-inspired expressiveness

Purposeful colour, distinctive selected states, recognizable components and personality.

The distinction is important: HORA-Q should not look like a copy of macOS or Android settings. It should have Apple's polish and Google's colour intelligence, expressed through a professional routing-security interface.

Use the prompt above for the next pass. It specifically corrects the mistake of making the application visually plain while retaining the usability improvements you've already achieved.