# HORA-Q: How to make the UI genuinely simpler

Looking at your latest screenshots, I can see why the redesign still isn't what you wanted. The interface needs a redesign of how information is organized, not another round of CSS styling.

The new Overview screenshot is particularly revealing: at roughly 635 pixels wide, the fixed sidebar still takes up a large part of the screen, the HORA-Q logo wraps, the header controls compete for space, and the main content becomes cramped. The other screenshots still show the same dense desktop-oriented design.

That means we need to solve two connected problems:

1. Reduce the mental effort required to understand HORA-Q.
2. Give the entire application a coherent, carefully crafted visual identity.

The target is the best of Google's clarity and familiarity combined with Apple's visual restraint and attention to detail—not a literal copy of either brand.

## What the research says

I reviewed guidance from Apple's Human Interface Guidelines, Google's design team, Nielsen Norman Group, Microsoft's Fluent design system, IBM Carbon, GitHub Primer and W3C accessibility standards.

[Mac screenshots for the nth time - All this](https://images.openai.com/static-rsc-4/71Oqc7e4PMfptPztQlN6-e7btX-PEY6Za1c1VXgckBE8h34KQ0T_PWyZcwVzvGijYZGcQtILT4ujdKS8s9Va-SUYmcyTnp3vw-WBxQThg2r8ZrfrrZOCQVPkEp6urZC8aVPuKPUzk7ILGpmrxtQJdKSo1hUnPMLjuCtD_Jxq9mA?purpose=inline)

1\. Apple: simplicity comes from removing unnecessary decisions

Keep essential actions visible; make advanced options available when needed. Simplicity does not mean deleting powerful functionality. It means arranging it so that people can focus on their current task.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://developer.apple.com\&sz=32)

Apple Developer Documentation

+2



[FAB: UX Design Win](https://images.openai.com/static-rsc-4/TJEUFipHgiXz27R1DC1iRrEtnJqhF4h4HhIkiZvXea6XycnjiY5l4zjlE5IjcA1avPRpEqTj-3oUiQjsJrjuaod1ETMCi6vefihIYtD_Sxx0UIu6pAJbRhiu_Q-AF1TZkOtK0AiGVv9JKTxgA3tXF2emWIiUK7rGBcEj0lRxvB0?purpose=inline)

2\. Google: balance simplicity with useful control

Familiar interaction patterns help people understand a product, but specialist users still need precision. Google Design's work on balancing simplicity and control supports designing a straightforward default experience without eliminating expert functionality.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://design.google\&sz=32)

design.google

+1



[Begin Scanning a GitHub App](https://images.openai.com/static-rsc-4/4j00MBtr_vGfpQ64OfpWFk5E_KoygiX9xoAQYuF6gcc0G5NUHzmKTzN4o7vV8O1XzrZy0n-mCM6ZIId8wdZkAfz68Uu1uzPBvXSbZc1luBx4fPjODeMxxoeRZO0N6EFMjPkxUL8Ndli9hk9PxTkPCSwsNfvce3dZ3wJb0VEfnfs?purpose=inline)

3\. Nielsen Norman Group: reveal complexity progressively

Show the few options users need first. Reveal specialist settings, raw JSON and detailed verification metadata on demand. This approach makes complex tools easier to learn without making them less capable.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.nngroup.com\&sz=32)

NN/G



[Example of data table with row expansion | Design system, Human interface guidelines, Finance app](https://images.openai.com/static-rsc-4/Rj6GHwfg2Sjbp4zey1PkAOzpJ1v4OGzbCCaX_RdU0rviNk4ynZrL_RmysKa-eslLN_OC0v9VgGIlXVHmBEu4v9wsLvF46-k-0JL8Lmc60b4S-A1NpXf33oAFQ0pcS-ieqKnQqfpl5213GMW9oNMCZ16wH3p0_rWvvy50h9iW4RA?purpose=inline)

4\. Enterprise design systems: make data easy to scan

Consistent spacing, meaningful status labels and disciplined tables let users find the important information quickly. Status should use labels and visual cues together, not color alone.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://fluent2.microsoft.design\&sz=32)

Fluent 2 Design System

+1



[Leaving Next.js behind • Jean Tinland](https://images.openai.com/static-rsc-4/pZVbQYyxEPqgC-V29Cm1ioN5KnYe8A9siUaNbpd3YWnUy-5kEy08ACclGv-mWbVliK-bgu1L-VV6AiGbSqv4scUHYQOFv22v0P49QftKMRkxWAmrzHj3JAWN-g3BvLKDeAuAYanMXSfNyT_weFW1aOZawj9laVJTNV8d3GvMhkg?purpose=inline)

5\. Responsive design: adapt, don't just shrink

A narrow screen requires an adapted navigation and a simpler information layout—not a desktop sidebar squeezed beside a tiny content column. W3C's reflow guidance targets usable layouts down to 320 CSS pixels without requiring two-dimensional scrolling for ordinary content.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://primer-docs-preview.github.com\&sz=32)

Primer

+1



[Sleek Incident Management Dashboard UI - UI Dux](https://images.openai.com/static-rsc-4/T8MtiSex2eohzKt_LA8MdBkpW8kbdn6rusJKbYx4ceyOzPUXOmRmxGGMotO4kSaU8T42emsuWVbpejiRr2Bmf6kKpjbif5V68cbZo1z9fFul4RwcmhbhmgsIX3kYkKXNXHkjFPe8IlPzRcVbXLRHHaV9v4aN16Ljng3XMpw7k50?purpose=inline)

6\. Security dashboards: prioritize instead of making everything urgent

Nielsen Norman Group warns that dashboards can overwhelm people when critical values are not prioritized. HORA-Q needs to distinguish the most important unresolved incident from routine observations and historical evidence.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.nngroup.com\&sz=32)

NN/G



Readability must be part of the redesign, too: WCAG 2.2 Level AA specifies a 4.5:1 contrast ratio for ordinary text, with defined exceptions for large text and other cases.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.w3.org\&sz=32)

W3C



## The critical change: redesign the user's journey

Right now, HORA-Q makes a person process too many technical concepts before they can understand what is happening. The new interface should follow a much simpler path:

What is happening?

Is monitoring running? Are there unresolved anomalies?

What needs attention?

Show the highest-priority incident and why it matters.

What is the evidence?

Expose routing details and integrity results when requested.

What happens next?

Make the available action and its actual outcome clear.

This is the foundation for the new design. The goal is not simply fewer cards; it's fewer unnecessary decisions and less information competing for attention.

## The prompt to use in your coding agent

The previous direction was too broad: it described the desired result, but your new screenshot shows the layout still needs fundamental structural changes. Use this more concrete prompt, and attach all 10 current screenshots to the coding agent as references.

# HORA-Q — Zero-Clutter, Apple-Quality UX Redesign

## Your responsibility

Act as the principal product designer and senior frontend engineer redesigning HORA-Q, an explainable BGP origin and subprefix anomaly monitoring application.

I am not asking for a few CSS improvements, new colors, prettier cards, or a generic AI-generated dashboard.

I want a **genuine product-level UI/UX redesign** inspired by the clarity, familiarity, restraint and craftsmanship associated with Google and Apple products.

The application currently feels complex because too many things compete for attention: repeated cards, long technical explanations, excessive borders, numerous badges, repeated incident descriptions, technical terminology and unclear status counts.

Your job is to eliminate this unnecessary complexity while preserving the technical depth and functionality of a serious network-security product.

**You must implement the redesign in the existing codebase. Do not simply give recommendations, create a mockup, or change only the mobile CSS.**

## 1. First diagnose why the current design fails

Inspect the supplied screenshots and the actual source code.

The current screenshots reveal these problems:

- At narrow widths, the fixed sidebar consumes too much of the screen. The HORA-Q logo wraps, header controls collide, and content becomes cramped.
- The Overview displays system status, numerous metrics, scenario cards and repeated controls without making the most important information obvious.
- Alerts repeat similar incident explanations in large bordered containers.
- Evidence screens expose too much technical information at once.
- Navigation categories such as "Resources" and "Verification" do not establish an obvious mental model.
- Several labels imply that a threat has been blocked, a system is protected, or evidence is immutable. Verify what the application actually does before retaining these claims.
- Counts and states differ between screens. Investigate their underlying definitions rather than hiding the discrepancy with styling.

Do not assume that adding a breakpoint, changing card radius or applying a new color palette solves these problems.

## 2. Establish the product's design philosophy

Use these principles consistently throughout the entire application.

### Clarity first

A first-time visitor should understand the purpose of each page without needing an explanation from the developer.

Use one primary heading, a short description where useful, and a clear next action. Present important information first.

### Progressive disclosure

Keep essential information visible. Put specialist information behind clear, understandable controls such as:

- "View technical details"
- "Show full evidence"
- "View raw JSON"
- "Advanced settings"

Do not hide essential incident information behind multiple clicks. Keep the raw technical evidence available to reviewers.

### Visual restraint

Remove:

- Decorative blue outer glows.
- Excessive neon effects and gradients.
- Glassmorphism.
- Cards nested inside cards.
- Unnecessary outlines around every content group.
- Badges that add no meaningful information.
- Oversized decorative icons.
- Repeated labels and explanations.
- Excessive uppercase technical labels.

Use whitespace, alignment, typography and a small number of meaningful visual cues to establish hierarchy.

Do not replace one generic dashboard template with another.

### Familiar interactions

Prefer familiar navigation, tables, forms, buttons, expandable details and dialogs. Use clear labels, predictable placement and consistent behavior.

Do not invent unnecessary gestures, hidden interactions or custom navigation patterns.

### Honest system feedback

Always distinguish an available capability from an operation that has actually succeeded.

A matching SHA-256 digest is not proof of authenticity by itself. An unsigned evidence record must remain unsigned. A synthetic scenario must not appear to be a real internet routing incident. Do not claim actual traffic blocking unless that capability genuinely exists.

## 3. Visual system: polished, calm and consistent

Keep the existing dark mode available, but remove its excessive visual effects. Preserve any working theme controls.

Use a restrained neutral palette with clear foreground/background contrast. Use cyan sparingly for interactive elements, red for actual high-severity issues, amber for review states and green for verified success. Pair status colors with readable labels and appropriate symbols.

Suggested dark-theme starting tokens:

- Application background: #0B0D10
- Main surface: #12161B
- Secondary surface: #171B21
- Borders: #2A3038
- Primary text: #F1F5F9
- Interactive accent: #38BDF8

Treat these as starting points; verify actual contrast and readability before using them.

Use a clean sans-serif for interface text and reserve monospace for IP prefixes, ASNs, hashes and raw technical values.

Create reusable tokens and components for typography, spacing, colors, buttons, inputs, tables, alerts, statuses, dialogs and page headers.

Use a consistent 4px-based spacing scale. Avoid arbitrary spacing and inconsistent control heights.

Meet WCAG 2.2 AA text contrast requirements where applicable. Preserve keyboard access, visible focus indicators and readable text at enlarged zoom.

Do not add a new UI framework or dependency unless existing tools genuinely cannot satisfy the design requirement.

## 4. Fix the responsive architecture before polishing details

The supplied narrow-screen Overview is not acceptable.

At approximately 635px wide, the application must not retain a permanent desktop sidebar next to an artificially narrowed content column.

Implement adaptive navigation and page layouts:

- Wide desktop: a stable, compact sidebar and a spacious main content area.
- Tablet and narrow desktop: a collapsible navigation or slide-out drawer as needed.
- Mobile: a compact top bar with a menu control, no permanently reserved sidebar width, and a single-column content layout.
- Small widths: move secondary header actions into an overflow menu; collapse search into an accessible control rather than allowing the header to wrap or overlap.

Use actual responsive breakpoints based on available content width, not device names alone.

Ensure layout containers can shrink correctly using suitable grid/flex sizing and minimum-width handling. Avoid fixed content widths that cause overflow.

At every width:

- The logo remains intact.
- Navigation controls remain reachable.
- Main content uses the available space.
- Buttons and headings do not overlap.
- Forms fit the viewport.
- Text and cards do not get clipped.
- Ordinary content does not cause page-wide horizontal scrolling.

Test at 1440×900, 1024×768, 635×950, 390×844 and 320×700.

A screenshot that still shows the desktop sidebar squeezing the content at 635px is a failed result.

## 5. Simplify the information architecture

Keep every existing route and its functionality, but make the navigation understandable.

Use concise navigation names and meaningful grouping. A suitable initial structure is:

**Monitor**

- Overview
- Alerts
- Route baselines

**Investigate**

- RPKI check
- Test a route

**Evidence and testing**

- Audit history
- Scenarios

Settings remains at the bottom.

Adapt the grouping to the existing application if a better structure is supported by the actual workflows, but avoid vague category names and excessive hierarchy.

On mobile, show the current page clearly and make all destinations accessible from the navigation drawer.

## 6. The Overview: design this screen first

The Overview is the most important page. It should immediately communicate three things: whether monitoring is running, what requires attention, and where the user should go next.

Use this content order:

### A. Page header

**Routing overview**

A short sentence explaining that HORA-Q monitors BGP announcements for origin conflicts and unexpected more-specific routes.

### B. Actual monitoring status

Show the real monitor state and data source.

Examples: "Monitoring running", "Waiting for data", "Demo data", "Live collector disconnected".

Render only the state supported by the actual application.

Remove dramatic hero content such as "System protected" or "10 anomalies identified and quarantined" unless both the exact state and claimed action are proven by the implementation.

### C. One primary alert summary

When unresolved incidents exist, show a concise summary of the highest-priority issue.

Example wording:

"An origin conflict needs review"

"Prefix 192.0.2.0/24 was observed with origin AS64511, while the stored baseline is AS64496."

Primary action: **Review alert**

The values in the example are for demonstration only; use actual application data.

When no active incidents exist, show a clear, truthful empty state.

### D. Three or four useful metrics

Show only meaningful, non-duplicative metrics supported by real data, such as:

- Active anomalies
- Prefixes tracked
- BGP updates evaluated
- Connected peers, if this is genuinely monitored

Each metric gets one label and one number. Remove unnecessary explanatory mini-paragraphs.

Do not equate alerts with distinct incidents. Do not present "threats blocked" when the application has only detected or recorded an anomaly.

### E. Recent activity

Display a short, scannable list of recent events with prefix, observed origin, timestamp and outcome. Provide a clear path to the full history.

### F. Demonstration scenarios

Move database seeding and database reset controls away from the primary Overview.

Place demonstration actions in the existing Scenarios page. If a shortcut is useful, expose one discreet "Try a demo" link or expandable section.

Database-reset operations must have appropriate confirmation and must not silently destroy existing data.

**The desired result is one clear primary task, a few useful metrics and a compact activity list—not a screen full of competing cards.**

Implement and visually verify the Overview at desktop and narrow viewport sizes before carrying the established design system across the other pages.

Do not stop after redesigning this one screen; continue through every existing route.

## 7. Simplify the remaining pages

### Alerts

Replace repeated, oversized incident cards with a compact, consistent incident list.

Keep the primary row information limited to severity, incident description, prefix, observed origin, baseline origin, timestamp and status.

Use a details drawer, expandable row or dedicated incident detail view for the full explanation, supporting observations and technical evidence.

Investigate repeated alerts. Group events only where the data model confirms that they represent the same underlying incident. Preserve legitimate separate observations.

Keep actions appropriate to the real implementation. Make Block, Allow and Acknowledge behavior clear and distinguish recording a decision from enforcing a security policy.

### Route baselines

Use a clean table or responsive list with:

- Prefix
- Reference origin ASN
- Observation count
- First seen, and last seen if available
- Provenance or validation result, if available
- One clear detail/validation action

Use simple language. Do not imply that first-seen data automatically proves a route is legitimate.

### Scenarios

Make the scenarios page a focused test workspace.

For each scenario show only its name, what it tests, expected outcome and Run action by default.

Place lengthy criteria and implementation details under "View test details". Clearly mark simulated announcements.

Keep Run suite, Seed demo data and Reset database separate, with appropriate feedback and confirmation.

### Cryptographic evidence

Make the first view understandable without requiring cryptography expertise.

Show:

- Evidence record identifier
- Associated incident
- Integrity result
- Signature result
- One-sentence explanation of the result
- Verify integrity action
- Export or copy action, where available

Place full hashes, canonical JSON, signature metadata and detailed verification output under clearly named technical-detail sections.

Keep the integrity result separate from the digital-signature result. Show "Unsigned" if unsigned, and do not claim immutable or tamper-proof storage solely because a digest exists.

Label an in-memory tampering demonstration as simulated. Preserve genuine verification and signing operations.

### Audit history

Rename confusing presentation copy where appropriate. Use a clean, readable event table with timestamp, event, affected resource and integrity information.

Shorten hashes visually while keeping full values available. Move technical explanations and canonical payloads into record details.

Do not describe the ledger as immutable or cryptographically non-repudiated unless the implementation supports those claims.

### RPKI inspector

Use a simple heading such as **Check route origin**.

Explain that the tool checks whether an origin ASN is authorized to announce the specified prefix, using available RPKI/ROA data.

Present the actual result and its reason clearly. Distinguish an invalid origin, missing authorization data and an unavailable validation service when the backend exposes those states.

Do not display preset values as if they were results from a live check.

### Manual route test

Use a plain heading such as **Test a route announcement**.

Group the prefix and origin ASN fields first. Put collector vantage point and scenario tag in an optional "Advanced details" section if they are not essential to the primary task.

Explain that this submits an application test observation and does not change real internet routing.

Retain validation, presets, request progress and truthful success/error feedback.

### Settings

Keep theme settings accessible. Separate actual system health from static architecture information.

Display backend and provider connectivity only when backed by real status checks. Move algorithm names, database implementation details and specialist configuration into a technical-information section.

## 8. Make the implementation measurable

Before coding, inspect the existing routes, components, styles, API calls and source of every important status/metric. Identify what is presentation-only and what represents real system behavior.

Then implement in this sequence:

1. Establish shared design tokens and fix the application shell/navigation.
2. Redesign and verify the Overview at desktop and narrow widths.
3. Apply the established components and information hierarchy to Alerts and every other page.
4. Simplify advanced details, technical terminology and misleading presentation copy.
5. Run visual, responsive, accessibility and regression checks; fix failures before declaring completion.

Use the actual application in a browser. Take before-and-after screenshots of every page at desktop and narrow widths using Playwright or an available browser tool. Inspect the screenshots instead of assuming successful rendering from a passing build.

If browser automation is available, use it. If unavailable, report that limitation honestly and provide exact manual verification steps.

Run the existing tests and the frontend type-check/build. Test the primary actions, filters, evidence verification, RPKI result handling, theme controls and scenario execution.

Do not replace genuine data with hardcoded examples to improve the screenshot. Do not remove features to make the page look empty. Do not modify backend security logic or the database just to support visual changes.

## 9. Definition of done

Do not declare completion until all of the following are true:

- The actual application has changed across all relevant pages.
- The Overview has an obvious reading order and one dominant next action.
- Technical details remain available but do not dominate ordinary use.
- Duplicated alert content and unnecessary containers have been reduced.
- Navigation and content fit the viewport at all five test sizes.
- At 635px wide, the sidebar no longer compresses the main content and the top bar remains usable.
- There is no unintended page-wide horizontal overflow, overlapping header content or clipped primary controls.
- Metrics, statuses and security claims accurately reflect the implemented behavior.
- Existing functionality still works.
- Build and test results are reported truthfully.
- Before-and-after screenshots are provided for inspection if the tooling permits.

At the end, summarize exactly what changed, list any remaining issues and report actual test results.

**Start by examining the existing code. Then implement the redesign; do not stop at an audit, a design proposal or a stylesheet-only patch.**

## What to do when you run it

Attach the screenshots again to your coding agent and run the prompt inside the existing HORA-Q project. The most important test is the result at 635 pixels wide: if the sidebar still squeezes the page, the layout is still not fixed.

Also evaluate the finished design against these three questions:

- Can a first-time visitor explain what HORA-Q does after looking at the Overview for five seconds?
- Can someone find and understand the most important alert without reading multiple paragraphs?
- Can a technical evaluator reach the full routing and cryptographic evidence without the default interface being overloaded?

If those are all true, you will have improved both usability and visual quality—not merely changed the appearance.