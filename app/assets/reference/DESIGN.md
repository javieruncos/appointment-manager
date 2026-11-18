---
name: Pitch Master Dark
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-tabular-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.02em
  label-tabular-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The brand personality is authoritative, agile, and technically refined—built for fast-paced sports management under night-play floodlights. The interface conveys operational precision and control, targeted at complex operators who manage bookings, lighting control, payments, and league tables simultaneously.

The visual direction combines high-contrast modernism with subtle technical brutalism. The canvas relies on a deep, light-absorbing obsidian void contrasted with ultra-vivid, luminous functional signals that mirror synthetic pitch grass under LED stadium lights. Dense information hierarchy is balanced by razor-sharp borders and deliberate tabular legibility.

## Colors
The palette is built around an ultra-dark environment with targeted functional accents:
- **Base Surfaces**: Canvas base sits at `#0A0A0A`. Default structural cards sit at `#141414`, elevating to `#1C1C1C` for hover states, nested sub-modules, and modals.
- **Structural Lines**: Dividing lines and ghost borders use `#262626` for subtle containment without visual clutter.
- **Primary Accent (Pitch Emerald / Neon Green)**: `#10B981` (with highlight `#34D399`) represents confirmed bookings, settled deposits, full payments, and available live pitches.
- **Interactive State / Active Accent (Electric Cyan)**: `#06B6D4` is reserved for navigation anchors, selected time slots, active tab switches, and live timers.
- **Pending / Warning (Warm Amber)**: `#F59E0B` signals pending reservations, unconfirmed deposit holds, and imminent payment timeouts.
- **Destructive / Alert (Coral Red)**: `#F43F5E` represents cancellations, refunds, pitch maintenance closures, and overdue invoices.
- **Text & Contrast Levels**: Primary typography uses `#F9FAFB` (high contrast), secondary data labels use `#9CA3AF`, and disabled or muted states use `#4B5563`.

## Typography
The system enforces dual-family typography:
1. **Primary Interface Font**: `Inter` handles all labels, headers, dialogs, and navigation points. Tracking is slightly tightened (`-0.01em` to `-0.02em`) on headers to present a compact, industrial look.
2. **Numeric & Data Font**: `JetBrains Mono` with forced tabular figures (`font-variant-numeric: tabular-nums`) handles court slot grids, financial summaries, balance sheets, duration clocks, and scorekeeping. This eliminates layout jitter during live schedule refreshes.

## Layout & Spacing
The layout follows a fluid 12-column grid anchored by a persistent narrow sidebar (64px collapsed, 240px expanded) and a dense operational schedule matrix.

- **Desktop (>= 1280px)**: 12-column system, 24px margins, 24px gutters. Daily timeline displays all synthetic pitches side-by-side in horizontal tracks.
- **Tablet (768px - 1279px)**: 8-column layout, 16px margins, 16px gutters. Timeline shifts to a pitch-selector segmented filter with horizontal swipe for hours.
- **Mobile (< 768px)**: 4-column layout, 16px margins, 12px gutters. Schedule transitions into vertical stacked card sequences grouped by match time.
- **Rhythm**: All spacing follows an exact 4px/8px modular base scale to maintain tight, tool-like density across data grids and booking blocks.

## Elevation & Depth
Depth is created primarily through tonal tiering and razor-thin borders, avoiding diffuse blurred drop-shadows that degrade contrast on deep OLED blacks:

- **Level 0 (Canvas)**: `#0A0A0A` base background.
- **Level 1 (Card Grid)**: `#141414` fill with a `1px` solid border in `#262626`.
- **Level 2 (Active/Hover)**: `#1C1C1C` fill with a `1px` solid border in `#333333` and an optional ambient glow tint: `0 0 12px rgba(16, 185, 129, 0.12)` for pitch booking cards.
- **Level 3 (Overlays & Modals)**: `#1A1A1A` with a 1px border in `#383838`, elevated by an ambient rim shadow: `0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 8px 10px -6px rgba(0, 0, 0, 0.8)`.
- **Level 4 (Popover / Dropdowns)**: `#1F1F1F` with backdrop blur (`backdrop-filter: blur(12px)`) and a `1px` border in `#3F3F46`.

## Shapes
The system uses tight, disciplined geometry (Soft: 4px base radius) to reinforce its industrial dashboard utility.
- Input fields, data cells, badges, and small buttons use `rounded-sm` (4px).
- Cards, timetable blocks, and schedule columns use `rounded-md` (8px).
- Modals, action sheets, and flyout menus use `rounded-lg` (12px).
- Status dot indicators and circular quick-action avatars use 9999px (full circle).

## Components

### Buttons
- **Primary (Action/Confirm)**: Emerald background (`#10B981`), dark text (`#052E16`), font weight 600. On hover: `#34D399` with `box-shadow: 0 0 12px rgba(16, 185, 129, 0.3)`.
- **Secondary (Active Filter/Tool)**: `#141414` background with `1px solid #262626` and cyan text (`#06B6D4`). On hover: border `#06B6D4`, background `#1C1C1C`.
- **Destructive**: Low-opacity coral fill (`rgba(244, 63, 94, 0.12)`) with coral border (`rgba(244, 63, 94, 0.35)`) and text (`#FB7185`).
- **Ghost/Tertiary**: Transparent background, text `#9CA3AF`, hover text `#FFFFFF` with hover background `#1F1F1F`.

### Status Badges & Chips
- Designed with high-contrast text and a semi-transparent base for rapid scanning:
  - **Pagado / Confirmado**: Background `rgba(16, 185, 129, 0.1)`, text `#34D399`, border `1px solid rgba(16, 185, 129, 0.25)`.
  - **Seña Pendiente**: Background `rgba(245, 158, 11, 0.1)`, text `#FBBF24`, border `1px solid rgba(245, 158, 11, 0.25)`.
  - **Cancelado**: Background `rgba(244, 63, 94, 0.1)`, text `#FDA4AF`, border `1px solid rgba(244, 63, 94, 0.25)`.
  - **En Juego (Live Match)**: Cyan base `rgba(6, 182, 212, 0.1)`, text `#22D3EE`, border `1px solid rgba(6, 182, 212, 0.3)` with a pulsing 6px dot.

### Pitch Schedule & Booking Cards
- Individual booking slots inside the pitch matrix feature an accent left border (`3px solid`) coded to the booking state:
  - Confirmed: `#10B981`
  - Pending Deposit: `#F59E0B`
  - Blocked/Maintenance: `#4B5563`
- Slot contents: Customer name (`Inter 13px weight 600`), match time & court identifier (`JetBrains Mono 12px`), amount remaining (`JetBrains Mono 12px`).

### Input Fields & Search Bars
- Background `#0F0F0F`, border `1px solid #262626`, text `#F9FAFB`.
- Focus state: border `#06B6D4` with inner glow `0 0 0 1px #06B6D4`. Placeholder text `#4B5563`.
- Currency and phone inputs include monospace prefix tags (`ARS $`, `+54`) styled with `#6B7280` text and an `#1C1C1C` background separator.

### Tables & Data Grids
- Compact row height (40px default, 48px dense expanded).
- Header row: `#0F0F0F` background, uppercase tracking `0.05em`, text `#6B7280`, bottom border `1px solid #262626`.
- Alternating row zebra striping is omitted; instead, rows highlight on hover to `#1A1A1A` with a cyan left border indicator (`2px`).
- Monospace font is strictly applied to match revenue, balance, duration, and court numbers.