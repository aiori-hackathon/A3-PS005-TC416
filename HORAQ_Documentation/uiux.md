# HORA-Q needs a different design approach—not another theme patch

I've now checked the previous AIORI winners' public project material and Google's product-design guidance. Your latest screenshots make the core problem clearer: the interface is too small for the available desktop space, the main content is overly centred and narrow, and almost every type of information has been forced into the same dark-blue container style.

Changing the shade of blue won't solve those problems.

## 1. What the previous winners actually built

The official AIORI-2 physical hackathon results identify these projects among the winners:&#x20;

[image](https://www.google.com/s2/favicons?domain=https://portal.aiori.in\&sz=32)

2 -2025-Draft

+1



[Set up your own PQC testbed for DNSSEC with the PATAD open-source software | SIDN Labs](https://images.openai.com/static-rsc-4/UVkCfPo1N0pSeAVfCTuHxpAQwy24j5MFhg4LtgblByUIjM9QDCuy26Q1aSiEUjGa7gA6P-p8N7lETK9rxtsh2MNizXaAb_gTe18Oc_DULZadvNxrKy-KL-rQyJQB0H9V-KErB2v_wv6AiN4ZZydDusEnitNGDznM8whztLdT5Rc?purpose=inline)

Timeless Innovators — Post-quantum DNSSEC

Their public repository documents a DNSSEC testbed using PowerDNS, MySQL and post-quantum cryptographic tooling. The material focuses on the working infrastructure and verification experiments.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



[Project repository](https://github.com/debasmitadutta14/Aiori-Timeless-Innovators?utm_source=chatgpt.com)

[Anycast Routing – One IP, Everywhere | Software System Design](https://images.openai.com/static-rsc-4/SyE8RsDQeERwV5uExunKkWjoAhp3iDEvAKTk0iyV_BxuASzGdZmcrQY6hQJywma8TSjgs8Fo3lllxYfz3TxeBKkJXnRPXj40yfJwJG23uTw2O5yPNa9oM9psprQEB9cSLZdaj_sr4nJepxwlDzx3JR5fJ5OiqMLq1ga6y37_hE0?purpose=inline)

FunnyCast — Anycast flipping and CDN experience

Its public repository describes reproducible network experiments, routing simulation and browser-performance measurement using tools such as Python, Mahimahi, NGINX and FRR.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



[Project repository](https://github.com/heres-aayush/FunnyCast?utm_source=chatgpt.com)

[LEOCN: Real-time and complete network simulation framework for LEO constellation networks1 - Cong Li, Haiyang Wang, Weipeng Liang, Yunhao Li, Hongyang Yan, Teng Huang, Bo Li, Jianwei He, 2024](https://images.openai.com/static-rsc-4/z5MUn2A7AJhpbqqXuZRSMtq5JhUlg3dXfFT1qqGld5qKJTo9lJu2fIpU2vAnl1l0qOWa8iSfgE2TDiEIptsssnGXO9RQp2ki7SEb82VdmoXwAp2AxPPWwF9JkS4oPh6yhuCAFoF6fmYIU4wze-4F3khYn4dzaUvOHdQqYxiEj6s?purpose=inline)

BYTE CODERS — LEO satellite network topology

The official results list their project around satellite-network topology and latency optimisation.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://portal.aiori.in\&sz=32)

Aiori-2

+1



[Project repository](https://github.com/Roshita598/BYTE_CODERS-AIORI_PROJECT?utm_source=chatgpt.com)

One important distinction: I found official winner listings and technical project repositories, but not a verified gallery of their finished product interfaces. So I cannot honestly claim the winning products used a particular dashboard style. Their engineering and demonstration approach can inform HORA-Q, but the visual benchmark should come from actual product interfaces.

## 2. The real visual benchmark: Google Cloud, not a generic admin template

[Use Security Command Center in the Google Cloud console  |  Google Cloud Documentation](https://images.openai.com/static-rsc-4/7E9SacJmnIqQMz3mNZAgiVq5JSKB336kvdrzGyZXxdwI5f6WWVWshv0w8XmHRiLmmUDL-4DoMdv6I5Q8Vn7_oaYQipeWQGj9Ixmu3vbngyap3SHY5ZRNimHWOVbXGo5S5mJasbblnotkbDGjYZyRd69OlYRnMB0YfLbGXyY_Dgw?purpose=inline)

Google Cloud Security Command Center

Google's security console provides a much more relevant reference for HORA-Q: a structured workspace, visible severity summaries, useful tables, clear navigation and information organised by what the operator needs to inspect.&#x20;

[View Google's security-console guidance](https://docs.cloud.google.com/security-command-center/docs/how-to-use-security-command-center?utm_source=chatgpt.com)

Google's Material 3 Expressive research also emphasises using colour, shape, size, motion and grouping to direct attention to important information—not applying the same visual container to everything.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://design.google\&sz=32)

design.google

+1



Apple's dark-mode guidance similarly calls for adaptive colours, clear foreground/background distinction and carefully chosen materials. It does not require every screen to be dark or every component to have a translucent effect.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://developer.apple.com\&sz=32)

Apple Developer Documentation

+1



My recommendation: make HORA-Q a Google Cloud Console-inspired, light-first product with Apple's visual craftsmanship, while retaining a genuinely polished dark theme. This is a more promising direction than continuing to refine the current all-navy interface.

## 3. The implementation prompt

Attach your latest 10 screenshots and use this prompt in the coding agent with `D:\HORA-Q` open. This is a structural redesign of the actual product, not another CSS-only colour change.

# HORA-Q — PRODUCT DESIGN OVERHAUL

## Google Cloud Console clarity × Apple craftsmanship × HORA-Q identity

### Mission

Redesign the existing HORA-Q cybersecurity application into a refined, credible, beautifully crafted web product.

The current implementation has gone through multiple visual iterations, but it still feels like a generic AI-generated dashboard. Changing colours, adding gradients or reducing the number of cards has not solved the core problem.

The next version must change the actual layout system, component design, typography, colour strategy, information hierarchy and visual composition.

Use the following references as design inspiration:

- Google's Security Command Center and Google Cloud Console for information hierarchy, practical navigation, readable tables, meaningful status summaries and operator-focused layouts.
- Material Design 3 for colour hierarchy, consistent interactions, component behaviour and purposeful expressive details.
- Apple's Human Interface Guidelines for typography, attention to detail, surface separation, visual materials and polished dialogs.
- The existing HORA-Q identity for BGP monitoring, origin conflicts, route baselines, RPKI validation and cryptographic evidence.

Reference material:

- Google Security Command Center: [https://docs.cloud.google.com/security-command-center/docs/how-to-use-security-command-center](https://docs.cloud.google.com/security-command-center/docs/how-to-use-security-command-center)
- Google's expressive design research: [https://design.google/library/expressive-material-design-google-research](https://design.google/library/expressive-material-design-google-research)
- Material 3 theming guidance: [https://developer.android.com/codelabs/m3-design-theming](https://developer.android.com/codelabs/m3-design-theming)
- Apple's Human Interface Guidelines: [https://developer.apple.com/design/human-interface-guidelines/](https://developer.apple.com/design/human-interface-guidelines/)

Do not copy the exact interface of these products. Create an original HORA-Q product using the design principles they demonstrate.

## 1. Research the previous AIORI winners without inventing a visual precedent

Before implementing the design, examine the public AIORI-2 winner materials where accessible:

- Timeless Innovators: [https://github.com/debasmitadutta14/Aiori-Timeless-Innovators](https://github.com/debasmitadutta14/Aiori-Timeless-Innovators)
- FunnyCast: [https://github.com/heres-aayush/FunnyCast](https://github.com/heres-aayush/FunnyCast)
- BYTE CODERS: [https://github.com/Roshita598/BYTE_CODERS-AIORI_PROJECT](https://github.com/Roshita598/BYTE_CODERS-AIORI_PROJECT)

The goal is to understand the technical demonstration approach, project presentation and emphasis on evidence, not to copy an undocumented interface.

Do not claim that any of these projects establishes a particular winning UI style unless an actual interface or presentation supports that conclusion.

Use their engineering context to guide HORA-Q's product presentation: show real capabilities, clear outcomes, reproducible tests, useful evidence and a professional technical identity.

## 2. Replace the current colour theme

### Primary appearance: Google-inspired light theme

The current dark navy/blue appearance should not remain the only polished experience or the assumed default.

Build a complete, carefully designed LIGHT theme first, inspired by the clarity of Google Cloud products.

Start with this palette:

- Main canvas: #F8F9FA
- Primary surface: #FFFFFF
- Secondary surface: #F1F3F4
- Selected surface: #E8F0FE
- Primary text: #202124
- Secondary text: #5F6368
- Divider: #DADCE0
- Primary blue: #1A73E8
- Darker interactive blue: #1765CC
- Success: #188038
- Warning: #B06000
- Critical: #D93025
- Informational: #1967D2

These are starting tokens. Validate readability and adjust appropriately.

Use blue as the main interaction colour. Keep green, amber and red for genuine operational states. Do not apply four different accent colours to neighbouring metric elements.

The result should feel open, precise and refined—not like a white version of the same dark dashboard.

### Secondary appearance: premium dark theme

Preserve the working dark-mode option, but redesign it to the same quality standard.

Use layered charcoal and graphite surfaces, readable foreground text, subtle dividers and the same meaningful blue accent. Dark surfaces must remain distinct without using a glowing border around the entire screen.

The light and dark themes must share the same component structure, spacing, typography and semantic status meanings.

If a theme preference already exists, preserve it. Set Light as the initial default for a new or unconfigured user experience, without unexpectedly overwriting an existing saved preference.

## 3. Fix the application's scale and layout

The latest 1650px-wide screenshots show the main content restricted to a narrow central column. Text, navigation and tables also appear unnecessarily small, leaving excessive empty space around the actual application.

Inspect the computed styles and source of the problem. Check max-width constraints, nested wrappers, root font sizes, browser zoom assumptions, transforms, CSS zoom and responsive media queries.

Do not fix this by simply enlarging a few headings.

### Desktop layout

- Keep the main sidebar approximately 232–248px wide where the available space supports it.
- Use a global toolbar around 56–64px high.
- Give the main content approximately 40–48px of horizontal padding at normal desktop widths.
- Use a main content container that can grow to around 1280–1360px, limited by available space.
- Let wider tables and operational content use the available workspace instead of forcing the whole product into an 880px column.
- Left-align page content consistently; do not centre every page within a narrow maximum-width container.
- Use the same alignment system for page headings, toolbars, tables and content sections.
- Preserve a comfortable reading width for explanatory text without constraining data-heavy pages unnecessarily.

At 1650px viewport width, the application must use the available horizontal space intelligently.

### Typography

Use a consistent, readable scale.

Suggested starting values:

- Main page headings: 28–32px.
- Section headings: 18–22px.
- Body text and primary controls: 14–16px.
- Table content: 13–14px.
- Secondary metadata: 12–13px where appropriate.
- Sidebar labels: 14px.

Do not render the whole application at a tiny font size. Inspect actual computed font sizes in the browser.

Use a clear sans-serif stack, preferably the existing suitable font or Roboto where available. Keep monospace for IP prefixes, ASNs, cryptographic hashes and machine-readable event identifiers.

Use readable line height and sufficient font weight for dark and light surfaces.

## 4. Replace generic cards with content-appropriate layouts

This is the central design requirement.

Do not treat every section as a reusable rounded rectangle. Use different layout patterns for different kinds of information.

### Metric presentation

Replace the four separate floating KPI cards with a cohesive metric strip or grid that has a strong typographic hierarchy and consistent alignment.

Use subtle separators, whitespace and restrained background treatment. A metric can have a contextual icon, but the icon must not become the main visual element.

Avoid arbitrary accent borders, individual colourful gradients and repetitive shadows. Keep all metric values and descriptions genuinely data-driven.

### Tables and ledgers

Use real structured tables for route baselines and audit history on desktop.

Tables should feature:

- Readable column headings.
- Consistent row heights and alignment.
- Subtle horizontal separators.
- A quiet hover state.
- Clear links and actions.
- Readable technical identifiers.
- An appropriate responsive representation at narrow widths.

Use a proper list or incident view where it is more useful than a table. Do not wrap each table row in its own card.

### Surface treatment

Reserve cards for genuinely distinct tasks or related controls. Use dividers, headings, spacing, grouping and background changes for ordinary content.

Do not stack cards inside cards, give every component an identical radius or surround every element with a border.

Use elevation for actual foreground elements such as dialogs, menus and temporary overlays—not as decoration on every section.

### Buttons, tabs and chips

Use an intentional hierarchy:

- Primary action: clearly visible blue button.
- Secondary action: restrained neutral button.
- Tertiary action: unobtrusive text action.
- Selected filter: clear selected state with sufficient contrast.
- Status label: compact and semantic, not excessively pill-shaped.

Do not place segmented filters inside a large coloured capsule when a subtle border and selected background would work better.

Standardize control heights, spacing, focus states, hover behaviour and disabled appearance.

## 5. Make the global shell feel like a real Google product

### Top toolbar

Place the HORA-Q brand and navigation controls in their natural positions.

The toolbar should contain:

- Brand at the left.
- Breadcrumbs or contextual information where appropriate.
- Search, theme and notifications at the right.

Remove the permanently centred monitoring pill if it creates an awkward empty middle column.

Show monitoring state prominently inside the Overview and wherever the status is directly relevant. If a compact global status indicator is retained, it must have a clearly justified purpose and must not conflict with the current page's data-mode label.

### Sidebar

Use a clearly structured sidebar with understandable section labels, consistent icons and familiar interaction behaviour.

The selected navigation item should have a restrained blue-tinted background and an unmistakable indicator. Inactive navigation should remain readable rather than disappearing into muted gray.

Keep the sidebar width, typography, spacing and icon alignment consistent.

At narrow widths, use a proper navigation drawer instead of compressing the desktop sidebar.

## 6. Implement a distinct visual composition for each page

### Overview

Create a polished operational workspace with:

1. A strong page title and concise description.
2. A truthful monitoring/data-source indicator.
3. One clear monitoring summary.
4. A cohesive metric strip.
5. A recent-incident ledger with a clear link to all incidents.
6. A restrained route to the scenario testing workspace.

Do not use multiple oversized status boxes and repeated pills to communicate the same state.

### Alerts

Build an incident-focused interface rather than a gallery of cards.

Use a clean list or table with severity, incident type, prefix, observed origin, baseline origin, last-seen time and lifecycle state.

Provide useful filters and clear access to associated evidence. Group related observations only when supported by the actual data model.

An empty state should be proportionate and useful. Zero active incidents should not fill the entire screen with an oversized empty panel.

### Cryptographic evidence

Treat the evidence modal as a focused forensic inspector.

Use a polished dialog header, a concise incident summary, separate integrity/signature results, a clearly prioritised action area and expandable technical details.

Avoid identical nested cards for every section. Use spacing and separators to connect related information.

On desktop, give the dialog enough width for readable data and aligned actions. On mobile, stack the content and allow scrolling without clipped controls.

Never show successful signing or integrity verification unless the actual operation confirms the result.

### Tamper verification

Integrate the actual verification feedback into the same evidence visual language.

Use a clear warning treatment to distinguish a simulated payload mutation from an authentic application or storage compromise.

Display the original and recalculated digest where the feature provides them. Make the failed verification state obvious without replacing the entire screen with red panels.

### Route baselines

Use a properly proportioned data table, not repeated cards.

Keep prefix, origin ASN, observations, first-seen information and validation actions aligned. Add useful row hover and focus states.

### Scenarios

Create a well-structured scenario test suite.

Use distinct columns or aligned row regions for scenario name, description, expected outcome and execution action. Provide an expandable details section for technical criteria.

A clean baseline test expecting zero alerts must look neutral or successful—not critical. Use semantic severity colours only for the actual meaning of each state.

Keep reset and data-seeding operations clearly separated and preserve safeguards.

### Audit history

Use a professional forensic ledger optimised for scanning many records.

Make timestamps, event identifiers, affected resources, shortened digests and signature states readable. Preserve access to full digests and evidence details.

Use row separators and compact technical typography rather than turning every record into a separate card.

### RPKI inspector

Use a familiar, properly scaled form with a clear label for the prefix and origin ASN. Place presets in a secondary toolbar and keep the main validation action easy to find.

Present returned validation results in a clear result region with a concise explanation and supporting details where available.

Distinguish invalid data from unavailable validation service responses.

### Route-test form

Create a practical form with grouped inputs, clear validation and advanced parameters that can be expanded on demand.

Make the form responsive and avoid unnecessary containers. Preserve presets, submission behaviour and request feedback.

### Settings

Present settings like a well-designed preferences page.

Use labelled sections, clear controls and dividers. Theme selection should be a compact, polished selector with meaningful previews—not three oversized cards.

Keep system health and specialist technical metadata distinct. Preserve working theme controls and actual system-status behaviour.

## 7. Refine interaction quality

- Use consistent icons from the existing icon library.
- Add precise hover, focus, pressed, loading, success and error states.
- Use transitions only when they clarify interaction.
- Respect reduced-motion preferences.
- Maintain keyboard navigation and accessible labels.
- Meet WCAG 2.2 AA contrast requirements where applicable.
- Avoid shrinking text to squeeze content into a component.
- Avoid horizontal overflow, overlapping controls and truncated primary actions.

Do not add charts, graphs, trends, illustrations or animations merely to make the product feel modern. Add them only when they communicate actual useful information.

## 8. Mandatory implementation process

1. Inspect the current source tree, stylesheets, global tokens, components and routes.
2. Identify why the desktop layout, typography and spacing are undersized.
3. Build the light theme and core layout system first.
4. Redesign shared navigation, typography, tables, buttons, dialogs and metric components.
5. Apply the design to all existing pages without replacing their underlying functionality.
6. Inspect each actual rendered page in the browser and correct visual defects.
7. Test desktop and narrow-width layouts, including 1650×850, 1440×900, 1024×768, 635×950 and 390×844.
8. Run the existing frontend type-check, production build and relevant regression tests.
9. Check both themes and the real evidence-verification and scenario workflows.
10. Report the actual files changed and the tests executed.

Use browser automation and fresh screenshots if available. Compare the rendered results with the supplied screenshots. Do not rely on a successful build as proof of visual quality.

Preserve the existing backend contracts, BGP detection logic, database contents, incident grouping, RPKI checks, evidence records, cryptographic operations and navigation routes.

Do not hardcode example metrics or fake verification states. Do not change functional logic purely to make a screenshot look better.

## Definition of done

The result must feel like a real, carefully crafted Google-inspired security product—not a dark AI dashboard with a different palette.

It must have:

- A polished light-first design and equally considered dark theme.
- Correct desktop scale and use of screen space.
- Distinctive, content-appropriate component design.
- Properly structured tables and incident views instead of cards everywhere.
- Purposeful colour and visual hierarchy.
- High-quality typography and spacing.
- Cohesive settings and dialogs.
- Accurate monitoring and evidence status.
- Preserved functionality across all existing pages.

Implement the actual redesign. Do not stop at CSS colour changes, a design proposal or a screenshot mockup.

The most important change is to start with Google Cloud's structured, readable information layout and Apple's attention to detail—not with another colour palette. Your next screenshots should show larger, properly scaled content, real tables where data belongs, cards only where they add value, and a light theme that feels intentionally designed.