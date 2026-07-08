# 🚗 Car Dealership DMS — Master UI/UX Specification & Audit Document
**Version:** 2.0 | **Status:** Active Overhaul  
**Scope:** Full system redesign, feature audit, ghost-button elimination, colour/font system, CSV export, and new module specs

---

## TABLE OF CONTENTS

1. [Design System — Colour Themes](#1-design-system--colour-themes)
2. [Design System — Typography](#2-design-system--typography)
3. [Design System — Icons & Visual Language](#3-design-system--icons--visual-language)
4. [Settings Panel Specification](#4-settings-panel-specification)
5. [Car Stock UI](#5-car-stock-ui)
6. [Sales Inquiry UI](#6-sales-inquiry-ui)
7. [Test Drive UI](#7-test-drive-ui)
8. [Expenses UI](#8-expenses-ui)
9. [Workshop & Refurbishment UI](#9-workshop--refurbishment-ui)
10. [Employee Performance — Corrected Module](#10-employee-performance--corrected-module)
11. [GST Module (Settings)](#11-gst-module-settings)
12. [Finance & Loans Module (Settings)](#12-finance--loans-module-settings)
13. [Notifications System](#13-notifications-system)
14. [Daily Task Manager](#14-daily-task-manager)
15. [Graphs & Analytics Dashboard](#15-graphs--analytics-dashboard)
16. [Data Export — CSV Specification (All Sections)](#16-data-export--csv-specification-all-sections)
17. [Ghost Button & Broken Feature Audit Checklist](#17-ghost-button--broken-feature-audit-checklist)
18. [UX Interaction Standards](#18-ux-interaction-standards)
19. [Responsive & Accessibility Standards](#19-responsive--accessibility-standards)
20. [Pre-launch QA Checklist](#20-pre-launch-qa-checklist)

---

## 1. Design System — Colour Themes

### Philosophy
Professional, authoritative, and trustworthy. A car dealership DMS handles significant financial transactions — the colour system must convey precision, confidence, and clarity. No gradients on data-heavy tables. No saturated candy colours. Restraint on backgrounds; accent is used sparingly and purposefully.

---

### Theme A — OBSIDIAN FLEET *(Default / Recommended)*
**Personality:** Luxury tier. Premium dark workspace. Think Audi/BMW internal ops dashboard.

| Token                 | Hex       | Usage                                          |
|-----------------------|-----------|------------------------------------------------|
| `--bg-base`           | `#0D0F14` | App background (darkest)                       |
| `--bg-surface`        | `#14171F` | Cards, panels, sidebars                        |
| `--bg-elevated`       | `#1C2030` | Modals, dropdowns, hover states                |
| `--bg-input`          | `#1A1D27` | Form inputs, search bars                       |
| `--border-default`    | `#2A2E3E` | Default border for cards, dividers             |
| `--border-subtle`     | `#1F2333` | Subtle inner dividers                          |
| `--accent-primary`    | `#C8A84B` | CTAs, highlights, active nav — deep gold       |
| `--accent-hover`      | `#E3C06A` | Hover state on primary accent                  |
| `--accent-muted`      | `#3D3118` | Tinted background behind accent elements       |
| `--text-primary`      | `#F0F2F7` | Headings, primary labels                       |
| `--text-secondary`    | `#8A8FA8` | Subtitles, helper text, metadata               |
| `--text-disabled`     | `#3E4258` | Disabled inputs, ghost states                  |
| `--status-success`    | `#22C55E` | Confirmed, sold, active                        |
| `--status-warning`    | `#F59E0B` | Pending, awaiting, under review                |
| `--status-danger`     | `#EF4444` | Failed, cancelled, overdue                     |
| `--status-info`       | `#3B82F6` | Info banners, scheduled, in-progress           |
| `--status-neutral`    | `#64748B` | Archived, inactive, no-action states           |

---

### Theme B — SLATE MERIDIAN *(Light Professional)*
**Personality:** Clean, corporate, daytime-friendly. Think enterprise SaaS — dealership GM office.

| Token                 | Hex       | Usage                                          |
|-----------------------|-----------|------------------------------------------------|
| `--bg-base`           | `#F4F5F8` | App background                                 |
| `--bg-surface`        | `#FFFFFF` | Cards, panels                                  |
| `--bg-elevated`       | `#EEF0F5` | Modals, dropdowns                              |
| `--bg-input`          | `#F9FAFB` | Form inputs                                    |
| `--border-default`    | `#DDE1EC` | Default borders                                |
| `--border-subtle`     | `#EBEDF3` | Inner dividers                                 |
| `--accent-primary`    | `#1B3A6B` | Deep navy — authority, precision               |
| `--accent-hover`      | `#254F94` | Hover state                                    |
| `--accent-muted`      | `#E8EDF6` | Tinted badge/pill backgrounds                  |
| `--text-primary`      | `#0F172A` | Headings                                       |
| `--text-secondary`    | `#4B5570` | Subtitles                                      |
| `--text-disabled`     | `#B0B8CC` | Disabled states                                |
| `--status-success`    | `#16A34A` | Confirmed, active                              |
| `--status-warning`    | `#D97706` | Pending                                        |
| `--status-danger`     | `#DC2626` | Failed, overdue                                |
| `--status-info`       | `#2563EB` | Info states                                    |
| `--status-neutral`    | `#6B7280` | Archived                                       |

---

### Theme C — CARBON SPORT *(High Contrast Dark)*
**Personality:** Performance-oriented. Bold. Think sports car spec sheets.

| Token                 | Hex       | Usage                                          |
|-----------------------|-----------|------------------------------------------------|
| `--bg-base`           | `#080808` | Near-black background                          |
| `--bg-surface`        | `#111111` | Cards, panels                                  |
| `--bg-elevated`       | `#1A1A1A` | Modals                                         |
| `--accent-primary`    | `#E63946` | Crimson red — high-performance signal          |
| `--accent-hover`      | `#FF5A67` | Hover                                          |
| `--text-primary`      | `#FFFFFF` | Headings                                       |
| `--text-secondary`    | `#909090` | Subtitles                                      |
| `--border-default`    | `#252525` | Borders                                        |

---

### Theme D — PEARL SUMMIT *(Soft Light / Accessibility Mode)*
**Personality:** High readability, calm, accessible. Ideal for floor staff with bright-screen environments.

| Token                 | Hex       | Usage                                          |
|-----------------------|-----------|------------------------------------------------|
| `--bg-base`           | `#FAFAFA` | Warm off-white                                 |
| `--bg-surface`        | `#FFFFFF` | Cards                                          |
| `--accent-primary`    | `#2E5F8A` | Steel blue — measured authority                |
| `--text-primary`      | `#1A1A2E` | Deep ink                                       |
| `--text-secondary`    | `#5C6680` | Secondaries                                    |

---

## 2. Design System — Typography

### Font Pairings (4 selectable in Settings)

#### Pair 1 — INTER SYSTEM *(Recommended default)*
- **Display / Headings:** `Inter` — weight 700, 600, tracking -0.02em
- **Body:** `Inter` — weight 400, 500
- **Data Tables:** `JetBrains Mono` — weight 400, tabular-nums, 13px
- **Why:** Inter's optical sizing is purpose-built for dashboards. Tight, professional, universally readable.

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
font-feature-settings: "cv02","cv03","cv04","cv11"; /* Inter contextual alternates */
```

---

#### Pair 2 — SORA EXECUTIVE
- **Display / Headings:** `Sora` — weight 800, tracking -0.03em
- **Body:** `DM Sans` — weight 400
- **Data Tables:** `IBM Plex Mono`
- **Why:** Sora has a geometric confidence (think luxury car brochure copy). DM Sans keeps body neutral.

---

#### Pair 3 — GEIST PRECISION
- **Display:** `Geist` — weight 700
- **Body:** `Geist` — weight 400
- **Data Tables:** `Geist Mono`
- **Why:** Vercel's Geist is an extremely tight, modern font system. Unified family means no pairing friction.

---

#### Pair 4 — SPACE GROTESK INDUSTRIAL
- **Display:** `Space Grotesk` — weight 700
- **Body:** `Outfit` — weight 400
- **Data Tables:** `JetBrains Mono`
- **Why:** Space Grotesk has mechanical, engineered character — fits automotive context well.

---

### Type Scale (All pairs use this scale)

| Token              | Size  | Weight | Line Height | Usage                          |
|--------------------|-------|--------|-------------|--------------------------------|
| `--text-display`   | 28px  | 700    | 1.2         | Page titles                    |
| `--text-heading`   | 20px  | 600    | 1.3         | Section headers, card titles   |
| `--text-subhead`   | 15px  | 600    | 1.4         | Subheadings, table headers     |
| `--text-body`      | 14px  | 400    | 1.6         | Body copy, form labels         |
| `--text-small`     | 12px  | 400    | 1.5         | Captions, helper text          |
| `--text-micro`     | 11px  | 500    | 1.4         | Badges, status pills, tabs     |
| `--text-mono`      | 13px  | 400    | 1.5         | Table cells, IDs, prices       |

---

## 3. Design System — Icons & Visual Language

### Icon Set
**Primary:** `Lucide Icons` — clean, consistent, professionally maintained  
**Fallback:** `Phosphor Icons` — heavier weight options for larger UI elements  
**NO:** Emoji, FontAwesome 5 (too rounded/playful), flat-colour social icons

### Icon Usage Rules
- Navigation icons: 20px stroke-width 1.5
- Action buttons: 16px stroke-width 1.75
- Status indicators: 14px, always paired with text (never icon-only for status)
- Table row actions: 16px
- Empty states: 48px stroke-width 1.25

### Lucide Icon → Section Mapping

| Section                | Primary Icon       | Secondary Icons                     |
|------------------------|--------------------|-------------------------------------|
| Car Stock              | `Car`              | `PlusCircle`, `Search`, `Filter`    |
| Sales Inquiry          | `ClipboardList`    | `User`, `Phone`, `CheckCircle2`     |
| Test Drive             | `Navigation`       | `Calendar`, `Clock`, `KeyRound`     |
| Expenses               | `Receipt`          | `TrendingUp`, `Wallet`, `Tag`       |
| Workshop               | `Wrench`           | `HardHat`, `ClipboardCheck`, `Tool` |
| Refurbishment          | `Paintbrush2`      | `Layers`, `Package`, `RotateCcw`    |
| Employee Performance   | `BarChart2`        | `Users`, `Target`, `Award`          |
| GST                    | `FileText`         | `Percent`, `IndianRupee`, `BookOpen`|
| Finance / Loans        | `Landmark`         | `Banknote`, `CalendarClock`, `TrendingDown` |
| Notifications          | `Bell`             | `BellRing`, `BellOff`, `Check`      |
| Daily Tasks            | `CheckSquare`      | `ListTodo`, `AlarmClock`, `Flag`    |
| Analytics              | `BarChart3`        | `PieChart`, `TrendingUp`, `LineChart`|
| Settings               | `Settings2`        | `Palette`, `Type`, `UserCog`        |
| Data Export            | `Download`         | `FileSpreadsheet`, `FileText`       |

---

## 4. Settings Panel Specification

### Panel Structure
```
Settings
├── General
│   ├── Dealership Profile (name, logo, address, contact)
│   ├── Operating Hours
│   └── Currency & Locale (₹ INR default)
│
├── Appearance
│   ├── Colour Theme (dropdown: 4 themes)
│   ├── Font Theme (dropdown: 4 font pairs)
│   ├── Sidebar Style (icons only / icons + labels / expanded)
│   └── Table Density (compact / default / comfortable)
│
├── Roles & Permissions
│   ├── Admin: full access
│   ├── Manager: all sections except Settings > Roles
│   └── Staff: assigned sections only (no delete, no export)
│
├── GST Configuration           ← NEW MODULE
├── Finance & Loans             ← NEW MODULE
│
├── Notifications
│   ├── Email notification toggles
│   ├── In-app notification toggles
│   └── Daily digest toggle
│
└── Data & Export
    ├── Backup schedule
    └── Export log (last 10 exports with timestamp)
```

---

### Appearance — Colour Theme Switcher

**Component:** Segmented control OR card-grid picker (not a basic `<select>`)

```
[ ◉ OBSIDIAN FLEET ] [ SLATE MERIDIAN ] [ CARBON SPORT ] [ PEARL SUMMIT ]
  ████ preview swatch    ████             ████              ████
  Dark / Gold            Light / Navy     Dark / Crimson    Soft / Steel
```

- Switching applies immediately (CSS variable injection, no page reload)
- Choice persisted to `localStorage` AND user profile (server-side) — so theme follows the user across devices
- Admin can set a **system default** that non-admin users start with (but can override)

---

### Appearance — Font Theme Switcher

**Same pattern as colour picker — 4 card options**

```
[ INTER SYSTEM ] [ SORA EXECUTIVE ] [ GEIST PRECISION ] [ SPACE GROTESK ]
  Aa (preview)     Aa (preview)       Aa (preview)         Aa (preview)
  Dashboard-first  Luxury-forward     Technical-precise    Industrial-bold
```

- Font loaded via Google Fonts CDN or bundled WOFF2
- Preview card renders the dealership name in that font in real-time

---

### Roles & Permissions Matrix

| Permission                     | Admin | Manager | Staff |
|-------------------------------|-------|---------|-------|
| View all sections              | ✓     | ✓       | ✓ (assigned) |
| Create records                 | ✓     | ✓       | ✓     |
| Edit records                   | ✓     | ✓       | Own only |
| Delete records                 | ✓     | ✓       | ✗     |
| Export CSV                     | ✓     | ✓       | ✗     |
| Access Settings                | ✓     | Limited | ✗     |
| Change theme/font              | ✓     | ✓       | ✓     |
| Manage GST config              | ✓     | ✗       | ✗     |
| Manage Finance config          | ✓     | ✓       | ✗     |
| View Employee Performance      | ✓     | ✓       | Own only |
| Add/remove users               | ✓     | ✗       | ✗     |

> **CRITICAL BUG PREVENTION:** Ensure that when a non-admin user lands on Settings, the restricted sections (GST, Finance rates, Roles) are hidden entirely — not shown as greyed-out clickable items that silently do nothing (ghost UI).

---

## 5. Car Stock UI

### Page Layout
```
[Page Header]
  Title: "Car Stock"       [+ Add Vehicle] [Export CSV ↓]

[Filter Bar]
  Search: [______________]  Make: [All ▾]  Model: [All ▾]  Status: [All ▾]
  Year: [From ▾] [To ▾]    Fuel: [All ▾]  [Clear Filters]

[View Toggle]  [≡ List]  [⊞ Grid]

[Stock Table / Grid]

[Pagination]  Showing 1–20 of 147        [← Prev] [1][2][3]...[Next →]
```

---

### Table Columns (List View)

| Column           | Type       | Sortable | Notes                                              |
|------------------|------------|----------|----------------------------------------------------|
| Stock ID         | Mono text  | ✗        | Auto-generated, e.g. `STK-2024-0042`              |
| Vehicle Image    | Thumbnail  | ✗        | 64×48px, placeholder car silhouette if none        |
| Make & Model     | Text       | ✓        | Bold make, regular model                           |
| Year             | Number     | ✓        |                                                    |
| Variant / Trim   | Text       | ✗        |                                                    |
| Colour           | Pill+dot   | ✗        | Colour dot + text label                            |
| Fuel Type        | Pill       | ✗        | Petrol / Diesel / EV / Hybrid / CNG                |
| Odometer (km)    | Mono number| ✓        | Formatted: `42,500 km`                             |
| Asking Price (₹) | Mono number| ✓        | Formatted: `₹8,50,000`                             |
| Cost Price (₹)   | Mono number| ✓        | Admin/Manager only — hidden from Staff             |
| Margin (₹)       | Mono number| ✗        | Auto-calculated, Admin only                        |
| Status           | Status pill| ✓        | Available / Reserved / Sold / Under Repair         |
| Location/Bay     | Text       | ✗        | Showroom / Lot A / Workshop                        |
| Days in Stock    | Number     | ✓        | Auto-calculated from intake date                   |
| Actions          | Icon row   | ✗        | View, Edit, Delete, Mark as Sold, Add to Test Drive|

---

### Vehicle Detail Modal / Page

**Tabs within vehicle record:**
- Overview (specs, images gallery)
- Financials (cost, price, GST breakdown, margin)
- History (all status changes with timestamps and user)
- Documents (RC copy, insurance, service records — upload)
- Linked Inquiries (all sales inquiries attached to this vehicle)
- Test Drives (all test drives for this vehicle)

---

### Status Flow
```
Available ──→ Reserved ──→ Sold
    │                        
    └──→ Under Repair ──→ Available
```
Status change requires confirmation modal. Status changes are logged to History tab.

---

### Grid View Cards
Each card:
- Vehicle image (top half)
- Make, Model, Year (bold heading)
- Price (large mono)
- Fuel + Colour pills
- Days in stock (bottom left)
- Status pill (top right overlay on image)
- Hover: shows action buttons (View, Edit, Quick-sell)

---

### Ghost Button Checks — Car Stock
- [ ] "Add Vehicle" button — submits form and saves, does NOT just close modal with no action
- [ ] "Save Changes" on edit form — actually patches record and shows success toast
- [ ] "Mark as Sold" — updates status AND links to a Sales Inquiry (prompts to create one)
- [ ] "Delete" — shows confirmation modal (irreversible), not a silent delete
- [ ] Filter "Clear Filters" — resets ALL filter dropdowns to default, not just search box
- [ ] "Export CSV" — downloads file, not just opens a blank tab

---

## 6. Sales Inquiry UI

### Page Layout
```
[Header]  Sales Inquiries      [+ New Inquiry] [Export CSV ↓]

[Tabs]  All | New | Follow-Up | Negotiation | Won | Lost

[Filter Bar]
  Search by name/phone/vehicle   Assigned To: [All ▾]   Source: [All ▾]
  Date Range: [From] [To]        [Clear]

[Inquiry Table]

[Pagination]
```

---

### Table Columns

| Column             | Type         | Notes                                                    |
|--------------------|--------------|----------------------------------------------------------|
| Inquiry ID         | Mono text    | `INQ-2024-0138`                                          |
| Date               | Date         | Date received                                            |
| Customer Name      | Text         | Link to customer profile                                 |
| Phone              | Mono text    | Formatted                                                |
| Interested In      | Text         | Vehicle make/model or "Any SUV" / "Budget ₹10L"         |
| Linked Vehicle     | Text/Link    | Stock ID if specific vehicle selected                    |
| Source             | Pill         | Walk-in / Phone / Website / OLX / Referral / WhatsApp   |
| Assigned To        | Avatar+Name  | Sales staff member                                       |
| Budget (₹)         | Mono number  | Customer stated budget                                   |
| Stage              | Status pill  | New / Follow-Up / Negotiation / Won / Lost               |
| Last Contact Date  | Date         | Last interaction                                         |
| Next Follow-Up     | Date+icon    | Red if past-due                                          |
| Actions            | Icon row     | View, Edit, Log Call, Convert to Sale, Close Lost        |

---

### Inquiry Detail Panel (Right-side drawer or full page)

```
[Customer Info]
  Name, Phone, Email, Address

[Inquiry Details]
  Source, Vehicle Interest, Budget Range, Trade-In (if any)

[Timeline / Activity Log]
  ○ 12 Jan — Inquiry received (walk-in)
  ○ 14 Jan — Called, interested in white Creta, budget ₹12L
  ○ 17 Jan — Test Drive scheduled
  ○ 19 Jan — Negotiation: offered ₹11.5L

[Add Interaction]
  Type: [Call ▾]  Notes: [_________________]  [Log]

[Stage Controls]
  [Move to Follow-Up] [Move to Negotiation] [Convert: Won] [Close: Lost]

[Linked Documents]  (Upload quotation PDFs)
```

---

### Ghost Button Checks — Sales Inquiry
- [ ] "Log Call" — saves interaction to timeline with timestamp
- [ ] "Convert: Won" — creates a Sale record, links to stock (marks vehicle Sold)
- [ ] "Close: Lost" — prompts reason dropdown, saves stage change
- [ ] Stage tab filters — each tab actually filters the correct subset of records
- [ ] "Assigned To" reassignment — saves AND notifies the newly assigned staff member
- [ ] "Next Follow-Up" date picker — actually saves and triggers notification on due date

---

## 7. Test Drive UI

### Page Layout
```
[Header]  Test Drives        [+ Schedule Test Drive] [Export CSV ↓]

[View Toggle]  [Calendar ▾]  [List ▾]

[Filter]  Date: [Today ▾]  Vehicle: [All ▾]  Status: [All ▾]  Staff: [All ▾]

[Calendar View — Week grid or Day column]
  Each test drive = event block showing: Customer name, Vehicle, Time, Staff
  Colour-coded by status

[List View — Table below]
```

---

### Table Columns

| Column             | Type         | Notes                                          |
|--------------------|--------------|------------------------------------------------|
| TD ID              | Mono text    | `TD-2024-0021`                                 |
| Scheduled Date     | Date         |                                                |
| Time Slot          | Time range   | e.g. `10:30 – 11:00`                           |
| Customer Name      | Text         |                                                |
| Phone              | Mono text    |                                                |
| Licence Verified   | Boolean pill | Yes / No — mandatory before drive commences    |
| Vehicle            | Text+link    | Stock ID + Make/Model                          |
| Driver (Staff)     | Name         | Accompanying staff                             |
| Start Odometer     | Mono number  |                                                |
| End Odometer       | Mono number  | Filled after return                            |
| Distance (km)      | Mono number  | Auto-calculated                                |
| Status             | Status pill  | Scheduled / In Progress / Completed / Cancelled|
| Customer Feedback  | Rating+text  | 1–5 stars + notes (filled post-drive)          |
| Linked Inquiry     | Link         | INQ reference                                  |
| Actions            | Icon row     | View, Edit, Start Drive, Complete, Cancel      |

---

### Schedule Test Drive Modal

```
[Customer]         [ Search by phone or name  🔍 ] or [+ New Customer]
[Vehicle]          [ Select from Available stock ▾]
[Date]             [ Date picker — blocks unavailable slots ]
[Time Slot]        [ 09:00 ] [ 09:30 ] [ 10:00 ] ... (30-min slots, greyed if booked)
[Assigned Staff]   [ Staff member ▾ ]
[Licence Verified] [ ✓ Verified ] — checkbox, required
[Notes]            [ Optional notes ______________ ]

[ Cancel ]  [ Schedule Test Drive ]
```

---

### Complete Test Drive Flow
When "Complete" is clicked:
1. Modal opens: "Enter Return Details"
2. End odometer field (required)
3. Customer feedback: 5-star rating + notes (optional)
4. Status auto-updates to Completed
5. Prompt: "Convert to Sales Inquiry?" [Yes / No]

---

### Ghost Button Checks — Test Drive
- [ ] Time slot selection — selected slot is visually highlighted AND saved
- [ ] "Start Drive" — sets status to "In Progress" AND records actual start time
- [ ] "Complete" — enforces end odometer entry, calculates distance, saves feedback
- [ ] "Cancel" — prompts reason, saves with reason, does NOT silently disappear
- [ ] Calendar day blocks — clicking opens schedule modal with date pre-filled
- [ ] Conflict detection — double-booking same vehicle/same time shows error, not silent overwrite

---

## 8. Expenses UI

### Page Layout
```
[Header]  Expenses           [+ Add Expense] [Export CSV ↓]

[Summary Cards — top row]
  [ This Month Total ] [ Last Month ] [ YTD Total ] [ Top Category ]

[Filter Bar]
  Search   Category: [All ▾]   Approved By: [All ▾]   Date: [This Month ▾]
  Amount: [Min] to [Max]        [Clear Filters]

[Expense Table]

[Monthly Chart — bar chart of expenses by category below table]
```

---

### Summary Cards (KPI)
| Card             | Data                    | Icon          |
|------------------|-------------------------|---------------|
| This Month       | Sum of all expenses      | `Receipt`     |
| vs Last Month    | % change with arrow      | `TrendingUp/Down` |
| YTD Total        | Jan–current total        | `Wallet`      |
| Largest Category | Category name + amount   | `Tag`         |

---

### Table Columns

| Column           | Type         | Notes                                               |
|------------------|--------------|-----------------------------------------------------|
| Expense ID       | Mono text    | `EXP-2024-0089`                                     |
| Date             | Date         |                                                     |
| Description      | Text         | Short description                                   |
| Category         | Pill         | Fuel / Parts / Marketing / Salary / Utilities / etc.|
| Amount (₹)       | Mono number  | Right-aligned                                       |
| GST Component    | Mono number  | If applicable (links to GST module)                 |
| Paid By          | Name         | Staff member who incurred                           |
| Payment Method   | Pill         | Cash / Card / UPI / Bank Transfer / Cheque          |
| Receipt          | Icon/link    | Attachment indicator (📎 replaced by `Paperclip` icon) |
| Approved By      | Name         | Manager/Admin who approved                          |
| Status           | Status pill  | Pending / Approved / Rejected / Reimbursed          |
| Actions          | Icon row     | View, Edit, Approve, Reject, Mark Reimbursed        |

---

### Add Expense Modal

```
Date:          [ Date picker ]
Category:      [ Dropdown — categories admin-configurable in Settings ]
Description:   [ Text input ]
Amount (₹):    [ Number input — auto-formats with commas ]
GST Included:  [ ✓ ] → expands: GST Rate [▾] | GST Amount (auto-calc) | Net Amount
Payment Method:[ Dropdown ]
Paid By:       [ Staff dropdown (pre-filled: current user) ]
Receipt:       [ Upload file — PDF/JPG/PNG, max 5MB ]
Notes:         [ Optional textarea ]

[ Cancel ]  [ Add Expense ]
```

---

### Ghost Button Checks — Expenses
- [ ] "Add Expense" — saves to database, appears in table immediately (optimistic update or refresh)
- [ ] "Approve" — changes status, records approver name + timestamp
- [ ] "Reject" — requires rejection reason text field
- [ ] "Mark Reimbursed" — only available after "Approved" status
- [ ] Receipt upload — file actually uploads, link opens the file (not a dead link)
- [ ] GST toggle — when checked, sub-fields appear and auto-calculate correctly
- [ ] Category filter — filters correctly including multi-category view

---

## 9. Workshop & Refurbishment UI

### Two Sub-Sections

```
Workshop
├── Jobs (service/repair jobs for vehicles in stock or customer-owned)
│   ├── Job Card list/table
│   ├── Job Detail (tasks, parts, labour, timeline)
│   └── Job Completion
│
└── Refurbishment
    ├── Refurb Jobs (linked to a specific stock vehicle pre-sale)
    ├── Cost Tracker (parts + labour per vehicle)
    └── Sign-off before vehicle listed as "Available"
```

---

### Workshop Job Table Columns

| Column         | Type         | Notes                                              |
|----------------|--------------|----------------------------------------------------|
| Job ID         | Mono text    | `JOB-2024-0034`                                    |
| Vehicle        | Text+link    | Stock ID or customer-owned reg number              |
| Type           | Pill         | Service / Repair / PDI / Warranty / Accident       |
| Description    | Text         | Brief job description                              |
| Assigned Tech  | Name         | Technician responsible                             |
| Start Date     | Date         |                                                    |
| Est. End Date  | Date         | Red if past due                                    |
| Actual End     | Date         | Filled on completion                               |
| Parts Cost (₹) | Mono number  |                                                    |
| Labour Cost (₹)| Mono number  |                                                    |
| Total Cost (₹) | Mono number  | Auto-sum                                           |
| Status         | Status pill  | Pending / In Progress / Awaiting Parts / Completed |
| Actions        | Icon row     | View, Edit, Add Task, Mark Complete, Export Report |

---

### Job Detail Page

```
[Job Header]
  JOB-2024-0034  |  Vehicle: [STK-2024-0012 - Hyundai i20 2022]
  Status: IN PROGRESS   Technician: Ravi Kumar   Start: 10 Jan

[Tasks Checklist]
  ✓ Oil change
  ✓ Brake inspection
  ○ Tyre rotation (pending)
  ○ AC service (pending)
  [+ Add Task]

[Parts Used]
  | Part Name        | Qty | Unit Cost | Total |
  | Engine Oil 5W30  |  4  |  ₹350     | ₹1,400|
  | Oil Filter       |  1  |  ₹220     | ₹220  |
  [+ Add Part]

[Labour]
  | Labour Type   | Hours | Rate/hr | Total  |
  | Mechanical    |  2.5  | ₹400    | ₹1,000 |
  [+ Add Labour Entry]

[Cost Summary]
  Parts Total:   ₹1,620
  Labour Total:  ₹1,000
  GST (18%):     ₹471.60
  Grand Total:   ₹3,091.60

[Notes / Internal Comments]  [ Timeline ]

[ Complete Job ] [ Print Job Card ] [ Export PDF ]
```

---

### Refurbishment Sub-Section

Linked to Car Stock. When a vehicle enters Workshop for refurbishment before listing:

```
Refurbishment Jobs Table:
  Stock ID | Vehicle | Refurb Type | Status | Total Cost | Days Taken | Ready to List

Refurb Types (pills):
  Detailing | Paint Correction | Dent Removal | Upholstery | Mechanical | Full Refurb

"Ready to List" toggle — when enabled:
  → Vehicle status in Car Stock changes from "Under Repair" → "Available"
  → Refurb cost auto-added to vehicle's total cost basis (for margin calculation)
```

---

### Ghost Button Checks — Workshop & Refurbishment
- [ ] "Add Task" — row appears in checklist immediately, is saveable
- [ ] Task checkboxes — actually toggle completion state and save
- [ ] "Add Part" — row added to parts table, totals recalculate
- [ ] "Complete Job" — requires all mandatory tasks checked, then status updates
- [ ] "Print Job Card" — opens print-optimised view (not raw HTML dump)
- [ ] "Ready to List" toggle — actually updates Car Stock status (cross-module state sync)
- [ ] Labour rate fields — number inputs, not broken text fields
- [ ] GST auto-calc on total — verifies against GST module rate for services

---

## 10. Employee Performance — Corrected Module

### CRITICAL FIXES
1. **Remove "Admin" user from performance tracking** — Admin is a system role, not a salesperson. Admin should not appear in any performance leaderboard, KPI table, or rankings.
2. **Remove "Test" user/employee from all lists** — Any test accounts (test@, admin@test, dummy users) must be filtered out at the data layer using a `is_test_account: true` flag and excluded from all performance views.

**Implementation:** Add filter `WHERE is_active = true AND is_test_account = false AND role != 'admin'` to all employee performance queries.

---

### Performance Metrics Table

| Column               | Type         | Notes                                          |
|----------------------|--------------|------------------------------------------------|
| Employee Name        | Text+avatar  | Real employees only                            |
| Role                 | Pill         | Sales Executive / Manager / Technician         |
| Inquiries Handled    | Number       | Count this month                               |
| Test Drives Arranged | Number       |                                                |
| Vehicles Sold        | Number       |                                                |
| Revenue Generated (₹)| Mono number  | Manager/Admin only                             |
| Avg. Deal Cycle (days)| Number      | Avg days from inquiry to close                 |
| Conversion Rate (%)  | % with bar   | Won / Total Inquiries                          |
| Customer Rating      | Stars        | Avg from post-drive/post-sale feedback         |
| Jobs Completed       | Number       | For technicians                                |
| Period               | Date range   | Filtered by date range                         |

---

### Performance Detail (Per Employee)
- Monthly trend line chart (sales over 12 months)
- Stage funnel (Inquiries → Test Drives → Negotiations → Won)
- Top vehicles sold
- Customer feedback log

---

### Ghost Button Checks — Employee Performance
- [ ] Date range filter — applies to ALL metrics simultaneously, not just one column
- [ ] Export CSV — includes only visible (filtered) employees, no test/admin accounts
- [ ] "View Details" per employee — opens employee's full performance history
- [ ] Period comparison toggle ("vs last month") — actually loads and shows comparison data

---

## 11. GST Module (Settings)

### Location: Settings → GST Configuration

### GST Rates Configuration

```
[Header] GST Configuration     [+ Add Rate] [Save All Changes]

[Rate Table]
  | GST Rate  | Category          | HSN Code       | Active |
  |-----------|-------------------|----------------|--------|
  | 28%       | New Vehicles      | 8703           | ✓      |
  | 18%       | Services/Workshop | 9987           | ✓      |
  | 12%       | Used Vehicles     | 8703           | ✓      |
  | 5%        | Insurance (add-on)| 9971           | ✓      |
  | 0%        | Exempted Items    | —              | ✗      |

[Toggle: Add CESS on Vehicles]  
  Mid-size cars: + 17% CESS  |  Large/Luxury: + 20% CESS  |  SUVs: + 22% CESS
  (These are common Indian automotive CESS rates — admin should verify with CA)
```

---

### GST Invoice Generation
- Auto-applies correct rate based on transaction type
- Shows: Taxable Value, CGST, SGST, IGST (for inter-state), CESS
- Displays: Dealership GSTIN, Customer GSTIN (if B2B)
- Export as PDF or push to accounting integration

---

### GST Report
```
Monthly GST Summary:
  Output GST (Collected):    ₹3,42,800
  Input GST (Paid on parts): ₹48,200
  Net GST Liability:         ₹2,94,600

  [Export GSTR-1 data as CSV]  [Export GSTR-3B summary]
```

---

### Ghost Button Checks — GST
- [ ] "Add Rate" — actually adds a new editable row to the table
- [ ] "Save All Changes" — batch-saves all rate edits (not per-row)
- [ ] GST rate dropdown in Expenses — pulls live from this config, not hardcoded
- [ ] GST on invoice — correctly reads rate from this config per transaction category
- [ ] CESS toggle — enabling it correctly adds CESS column to vehicle sale invoices
- [ ] "Export GSTR" — generates correctly formatted CSV (test with CA before launch)

---

## 12. Finance & Loans Module (Settings)

### Location: Settings → Finance & Loans

### Finance Partners Configuration

```
[Header] Finance & Loan Partners        [+ Add Partner]

[Partner Cards]
  ┌──────────────────────────────┐
  │ HDFC Bank — Car Loan         │
  │ Base Rate: 8.75% p.a.        │
  │ Max Tenure: 84 months        │
  │ Max LTV: 85% of on-road price│
  │ Processing Fee: 0.5% + GST   │
  │ [Edit] [Activate/Deactivate] │
  └──────────────────────────────┘
  (repeat for each partner)
```

---

### EMI Calculator (Embedded in Sales Inquiry & Vehicle Detail)

```
Vehicle Price (₹):    [____________]
Down Payment (₹):     [____________]
Loan Amount (₹):      [auto-calc   ]
Interest Rate (%):    [____________]  [Select Partner Rate ▾]
Tenure:               [ 12 ] [ 24 ] [ 36 ] [ 48 ] [ 60 ] [ 72 ] [ 84 ] months

EMI: ₹12,450 / month
Total Interest: ₹1,48,400
Total Payable:  ₹8,98,400

[Share EMI Sheet with Customer] [Save to Inquiry]
```

---

### Loan Application Tracker

| Column          | Type         | Notes                                              |
|-----------------|--------------|----------------------------------------------------|
| Application ID  | Mono text    | `LN-2024-0067`                                     |
| Customer        | Text         |                                                    |
| Vehicle         | Text+link    |                                                    |
| Partner Bank    | Text         | Finance partner                                    |
| Loan Amount (₹) | Mono number  |                                                    |
| Applied On      | Date         |                                                    |
| Status          | Status pill  | Applied / Under Review / Approved / Disbursed / Rejected |
| Approval Date   | Date         |                                                    |
| Disbursement Date| Date        |                                                    |
| Actions         | Icon row     | View, Update Status, Upload Docs                   |

---

### Ghost Button Checks — Finance & Loans
- [ ] "Add Partner" — saves partner with all fields, partner appears in EMI calculator dropdown
- [ ] EMI calculator — all inputs trigger recalculation in real time
- [ ] "Share EMI Sheet" — either opens email/WhatsApp with pre-filled EMI breakdown, or downloads PDF
- [ ] "Save to Inquiry" — links EMI calculation to the sales inquiry record
- [ ] Loan status update — changes are logged with timestamp + who updated
- [ ] "Upload Docs" — file upload works, documents retrievable from loan record

---

## 13. Notifications System

### Notification Types

| Type                    | Trigger                                    | Recipient         |
|-------------------------|--------------------------------------------|-------------------|
| New Inquiry             | Inquiry form submitted                     | Assigned staff + Manager |
| Follow-up Due           | Next follow-up date = today                | Assigned staff     |
| Test Drive Reminder     | 1 hour before scheduled test drive         | Staff + Customer (SMS/Email) |
| Test Drive Completed    | Status → Completed                         | Manager            |
| Loan Status Update      | Finance partner status changes             | Assigned staff     |
| Vehicle Sold            | Inquiry converted to Win                   | Manager + Admin    |
| Stock Low               | Available stock < threshold (configurable) | Manager + Admin    |
| Expense Pending Approval| Expense submitted by staff                 | Manager            |
| Expense Approved/Rejected| Approval action taken                     | Submitter          |
| Task Due Today          | Daily task due date = today                | Assigned user      |
| Task Overdue            | Task past due date, not completed          | Assigned user + Manager |
| Workshop Job Delayed    | Job past estimated completion date         | Manager + Tech     |

---

### Notification Centre (Bell Icon)

```
[Bell Icon] (badge count)

[Notification Drawer — slides in from right]
  [All] [Unread] [Mentions]

  ● INQ-0138: New inquiry from Rahul Sharma — Creta 2024 [2 min ago]
  ● TD-0021: Test drive in 1 hour — Vikram Patel / Nexon [58 min]
  ○ EXP-0089: Expense ₹4,200 approved by Ankit Mehta [1 day ago]
  ○ Task: "Call back Priya — re: Baleno demo" overdue [2 days ago]

  [Mark all as read]  [View all notifications]
```

---

### Notification Settings (per user)
```
In-app Notifications:
  [✓] New Inquiries assigned to me
  [✓] Follow-up reminders
  [✓] Test drive reminders
  [✓] Expense updates
  [✓] Task due/overdue
  [ ] All system notifications (Admin only)

Email Digest:
  [✓] Daily summary (sent at 8:00 AM)
  [ ] Individual instant emails

Push Notifications: [Enable on this device]
```

---

### Ghost Button Checks — Notifications
- [ ] Bell icon badge count — updates in real-time (websocket or polling)
- [ ] Clicking a notification — navigates to the relevant record (not a dead link)
- [ ] "Mark all as read" — clears all unread badges, marks in DB
- [ ] "Mark as read" on individual — works per-notification
- [ ] Email digest toggle — actually registers/deregisters from email job
- [ ] Notification preferences save — changes persist across sessions
- [ ] Follow-up reminders — fire at the correct date/time (not immediately or never)

---

## 14. Daily Task Manager

### Page Layout
```
[Header] My Tasks       [+ Add Task]  [↓ Export CSV]  View: [Today ▾]

[Date Navigator]
  ← [Mon 13] [Tue 14 ●] [Wed 15] [Thu 16] [Fri 17] [Sat 18] →

[Priority Columns (Kanban) OR List View]
  HIGH               MEDIUM             LOW
  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
  │ Call Priya re │  │ Update stock  │  │ File expense  │
  │ Baleno deal   │  │ photos        │  │ receipts      │
  │ Due: Today    │  │ Due: Today    │  │ Due: Friday   │
  │ [Done][Edit]  │  │ [Done][Edit]  │  │ [Done][Edit]  │
  └───────────────┘  └───────────────┘  └───────────────┘
```

---

### Task Fields

| Field            | Type         | Notes                                              |
|------------------|--------------|----------------------------------------------------|
| Task ID          | Auto         | `TASK-2024-0201`                                   |
| Title            | Text         | Short task name (required)                         |
| Description      | Textarea     | Optional details                                   |
| Priority         | Pill select  | High / Medium / Low                                |
| Due Date         | Date         | Required                                           |
| Due Time         | Time         | Optional — enables timed notification              |
| Assigned To      | Staff select | Default: current user                              |
| Linked Record    | Smart link   | Optional: link to Inquiry / Vehicle / Customer     |
| Status           | Auto         | Todo / In Progress / Completed / Overdue           |
| Created By       | Auto         | System-filled                                      |
| Completed At     | Auto         | Timestamp on completion                            |

---

### Manager View (Admin/Manager only)
- Toggle: "My Tasks" / "All Tasks" / "Team Tasks"
- Filter by assigned user
- Overdue tasks highlighted in danger colour across all team members
- Weekly productivity summary: Tasks created vs completed per team member

---

### Ghost Button Checks — Daily Task Manager
- [ ] "Add Task" — saves and appears in today's or selected date's list
- [ ] "Done" button — marks complete, task moves to completed section, notification dismissed
- [ ] "Edit" — opens edit modal pre-filled with current values
- [ ] Priority drag in Kanban — reordering saves to DB (don't use client-only drag that resets on refresh)
- [ ] Date navigator arrows — correctly load tasks for the selected date
- [ ] Linked Record picker — search works, linking saves and creates navigable link
- [ ] "Assigned To" — reassigning notifies the new assignee
- [ ] Overdue tasks — status auto-updates to "Overdue" at midnight if not completed

---

## 15. Graphs & Analytics Dashboard

### Dashboard Overview Cards (KPI Strip)

```
[ Vehicles In Stock: 147 ] [ Inquiries This Month: 84 ] 
[ Test Drives This Week: 12 ] [ Sales This Month: 18 ]
[ Revenue This Month: ₹1.24 Cr ] [ Avg. Deal Value: ₹6.9L ]
```

---

### Chart Inventory (all sections need graphs)

#### Main Dashboard
| Chart                         | Type         | Description                                      |
|-------------------------------|--------------|--------------------------------------------------|
| Monthly Sales Trend           | Line chart   | 12-month rolling, vehicles sold + revenue        |
| Inquiries by Stage Funnel     | Funnel chart | New → Follow-up → Negotiation → Won/Lost         |
| Sales by Vehicle Category     | Bar chart    | SUV / Sedan / Hatchback / Commercial etc.        |
| Revenue vs Expenses           | Grouped bar  | Monthly comparison                               |
| Inquiry Source Distribution   | Donut chart  | Walk-in / Website / OLX / Referral / WhatsApp    |
| Staff Performance             | Horizontal bar| Sales per staff member this month               |
| Stock Age Distribution        | Bar chart    | Vehicles by days-in-stock buckets (0-30, 31-60..) |

---

#### Car Stock Charts
| Chart                   | Type         | Notes                                            |
|-------------------------|--------------|--------------------------------------------------|
| Stock by Fuel Type      | Donut        | Petrol / Diesel / EV / Hybrid                    |
| Stock by Make           | Bar          | Top makes in inventory                           |
| Stock Age Distribution  | Histogram    | Days in stock                                    |
| Stock Value Trend       | Area chart   | Total inventory value over time                  |

---

#### Sales Inquiry Charts
| Chart                   | Type         | Notes                                            |
|-------------------------|--------------|--------------------------------------------------|
| Stage Funnel            | Funnel       | Live pipeline view                               |
| Inquiries Over Time     | Line         | Daily/weekly/monthly toggle                      |
| Source Breakdown        | Donut        |                                                  |
| Conversion Rate Trend   | Line         | Monthly win rate                                 |

---

#### Expenses Charts
| Chart                        | Type         | Notes                                       |
|------------------------------|--------------|---------------------------------------------|
| Expenses by Category         | Bar          | This month                                  |
| Monthly Expense Trend        | Line/Area    | 12-month                                    |
| Expense vs Budget            | Grouped bar  | If budget limits configured                 |
| Biggest Expense Categories   | Donut        |                                             |

---

#### Workshop Charts
| Chart                         | Type    | Notes                                        |
|-------------------------------|---------|----------------------------------------------|
| Jobs by Status                | Donut   | Live count                                   |
| Jobs Completed per Technician | Bar     | This month                                   |
| Avg. Job Duration             | Bar     | By job type                                  |
| Parts Cost Trend              | Line    | Monthly                                      |

---

### Chart Library
**Recommended:** `Recharts` (React) or `Chart.js` with custom theming  
All charts must:
- Read colours from CSS variables (auto-adapt to theme changes)
- Show loading skeleton while fetching
- Show "No data for selected period" empty state (not blank/broken)
- Support date range filter from parent page
- Be exportable as PNG (right-click → save image sufficient, or export button)

---

## 16. Data Export — CSV Specification (All Sections)

### Global Export Rules
- Export button: always present in page header, top-right, labelled "Export CSV ↓" with `Download` icon
- Exports respect current active filters (exports what the user sees, not all data)
- Date range must be selectable in an export modal if not already filtered
- File naming: `{section}_{YYYY-MM-DD}_{filter-description}.csv`
- Character encoding: UTF-8 with BOM (for Excel compatibility)
- Numbers: unformatted in CSV (1850000, not ₹18,50,000) — format only in headers
- Dates: ISO 8601 format (YYYY-MM-DD) in CSV cells

---

### Car Stock CSV

**Filename:** `car_stock_2024-01-15.csv`

```
Stock ID,Make,Model,Year,Variant,Colour,Fuel Type,Transmission,Odometer (km),
Asking Price (INR),Cost Price (INR),Margin (INR),Status,Location,Intake Date,
Days in Stock,Registration Number,VIN/Chassis,Engine Number,
Last Modified,Modified By
```

---

### Sales Inquiry CSV

**Filename:** `sales_inquiries_2024-01-15.csv`

```
Inquiry ID,Date Received,Customer Name,Phone,Email,
Interested Vehicle,Linked Stock ID,Source,Budget (INR),
Assigned To,Stage,Last Contact Date,Next Follow-Up Date,
Interactions Count,Notes Summary,Created By,Last Modified
```

---

### Test Drive CSV

**Filename:** `test_drives_2024-01-15.csv`

```
TD ID,Scheduled Date,Start Time,End Time,Customer Name,Phone,
Licence Verified,Vehicle Stock ID,Vehicle (Make Model Year),
Assigned Staff,Start Odometer,End Odometer,Distance (km),
Status,Customer Rating,Customer Feedback Notes,Linked Inquiry ID,
Completion Date,Cancelled Reason
```

---

### Expenses CSV

**Filename:** `expenses_2024-01-15.csv`

```
Expense ID,Date,Description,Category,Amount (INR),
GST Rate (%),GST Amount (INR),Net Amount (INR),
Payment Method,Paid By,Approved By,Approval Date,
Status,Receipt Attached (Y/N),Notes
```

---

### Workshop Jobs CSV

**Filename:** `workshop_jobs_2024-01-15.csv`

```
Job ID,Vehicle Stock ID,Vehicle (Make Model),Job Type,Description,
Assigned Technician,Start Date,Estimated End Date,Actual End Date,
Parts Cost (INR),Labour Cost (INR),GST (INR),Total Cost (INR),
Status,Tasks Total,Tasks Completed,Notes
```

---

### Refurbishment CSV

**Filename:** `refurbishments_2024-01-15.csv`

```
Refurb ID,Stock ID,Vehicle (Make Model Year),Refurb Type,
Assigned To,Start Date,End Date,Duration (days),
Parts Cost (INR),Labour Cost (INR),Total Refurb Cost (INR),
Status,Ready to List (Y/N),Notes
```

---

### Employee Performance CSV

**Filename:** `employee_performance_2024-01-15.csv`

```
Employee Name,Role,Period Start,Period End,
Inquiries Handled,Test Drives Arranged,Vehicles Sold,
Revenue Generated (INR),Avg Deal Cycle (days),Conversion Rate (%),
Customer Avg Rating,Workshop Jobs Completed
```

> Note: Admin and test accounts excluded from all exports.

---

### Loan Applications CSV

**Filename:** `loan_applications_2024-01-15.csv`

```
Loan ID,Customer Name,Phone,Vehicle Stock ID,Vehicle (Make Model),
Finance Partner,Loan Amount (INR),Down Payment (INR),EMI (INR),
Tenure (months),Interest Rate (%),Applied Date,Status,
Approval Date,Disbursement Date,Rejection Reason,Documents Uploaded (Y/N)
```

---

### Daily Tasks CSV

**Filename:** `tasks_2024-01-15.csv`

```
Task ID,Title,Description,Priority,Due Date,Due Time,
Assigned To,Created By,Status,
Completed At,Linked Record Type,Linked Record ID
```

---

### GST Report CSV

**Filename:** `gst_report_2024-01.csv`

```
Transaction ID,Date,Transaction Type,Customer/Vendor,
Taxable Value (INR),GST Rate (%),CGST (INR),SGST (INR),
IGST (INR),CESS (INR),Total GST (INR),Total Amount (INR),
GSTIN (Customer),Invoice Number
```

---

## 17. Ghost Button & Broken Feature Audit Checklist

> A "ghost button" is any UI element that looks interactive but does nothing, throws a silent error, navigates to a broken route, or saves data that never persists.

### How to Audit
1. Click every button in every section
2. For each action: verify DB change / state change / toast/feedback
3. For each form: submit with empty fields → confirm validation fires; submit with valid data → confirm save and feedback
4. For each filter/dropdown: change value → confirm table/list updates
5. For each link: confirm it navigates to the correct destination
6. For each modal: confirm it opens AND closes correctly (both X button and cancel button)

---

### Master Audit Checklist

#### Navigation & Layout
- [ ] All sidebar navigation links navigate to the correct section
- [ ] Active nav item is visually highlighted
- [ ] Sidebar collapse/expand works and state is remembered
- [ ] User avatar/name in header links to profile/settings
- [ ] Logout button actually logs out and redirects to login

#### Forms (Universal)
- [ ] Required field validation shows error message on submit attempt
- [ ] Form submits only when all required fields are filled
- [ ] "Cancel" / "Close" / "X" on modals: closes without saving (no partial-save bugs)
- [ ] Success toast appears after successful save
- [ ] Error toast appears on failed save (not silent failure)
- [ ] Date pickers open and date selection populates the field correctly
- [ ] Number inputs accept only numbers (phone, price, odometer)
- [ ] Dropdowns close after selection
- [ ] Auto-calculated fields (margin, GST, EMI) update in real time as input changes

#### Tables (Universal)
- [ ] Sort arrows (▲▼) actually sort the data
- [ ] Sorted column has a clear visual indicator of direction
- [ ] Pagination: page numbers navigate to correct pages
- [ ] "Next" and "Previous" buttons work on both first and last pages
- [ ] "Next" is disabled on last page, not clickable but still visible
- [ ] "Previous" is disabled on first page
- [ ] Row click (if used for navigation) goes to correct detail
- [ ] Action buttons in rows (View/Edit/Delete) all work
- [ ] Delete confirmation modal appears — confirmed delete removes row from table
- [ ] "No results" empty state shown when filter returns zero rows (not blank white space)

#### Settings
- [ ] Theme change applies immediately and persists on page refresh
- [ ] Font change applies immediately and persists
- [ ] Role changes for a user take effect immediately (or on next login — documented)
- [ ] GST rates save correctly and are used in invoices/expenses
- [ ] Finance partner rates save and appear in EMI calculator
- [ ] Notification preferences save and are respected by the notification system

#### Cross-Module Integrity
- [ ] When a vehicle is sold (Inquiry → Won), its Car Stock status changes to "Sold"
- [ ] When a vehicle enters Workshop, its Car Stock status changes to "Under Repair"
- [ ] When Refurbishment "Ready to List" is enabled, Car Stock status → "Available"
- [ ] Test Drive linked vehicle shows the test drive in the Vehicle Detail page
- [ ] Linked Inquiry in a test drive opens the correct inquiry record
- [ ] Employee deleted from system → their records are attributed to "Former Employee [ID]" or reassigned, not orphaned/broken

---

### Red Flags (Fix Before Launch)
- Any button with an `onClick` that does `console.log` or `// TODO`
- Any `href="#"` links
- Any `disabled` buttons that are disabled by mistake (not intentionally)
- Any API calls without error handling that fail silently
- Any `useEffect` data fetches that don't handle loading and error states
- Any delete operations without a confirmation gate
- Any navigation that goes to a 404 or blank page
- Any permission-protected actions that are visible but trigger an error when clicked (should be hidden, not error)

---

## 18. UX Interaction Standards

### Toast Notifications (All save operations)

| Event          | Toast Type | Message Pattern                                  | Duration |
|----------------|-----------|--------------------------------------------------|----------|
| Success        | Green     | "[Record Type] saved successfully."               | 3s       |
| Update         | Green     | "Changes saved."                                  | 3s       |
| Delete         | Warning   | "[Record] deleted. [Undo ↩]"                      | 5s       |
| Error          | Red       | "Failed to save. Please try again." + support    | 6s       |
| Info           | Blue      | Informational message                             | 4s       |

**Toast position:** Top-right corner, stacked if multiple  
**No modal for non-destructive success** — toast only  
**Modal for destructive actions** — "Are you sure? This cannot be undone." with Confirm (danger-coloured) and Cancel

---

### Loading States
- Table loads: skeleton rows (not spinner in centre of table)
- KPI cards load: skeleton shimmer on the number area
- Modal opens: immediately visible, content loads inside (no full-page spinner)
- Chart loads: grey placeholder rectangle with spinner inside
- Button action in progress: button shows loading spinner + disabled state (no double-submit)

---

### Empty States
Every list, table, and chart must have a designed empty state:

```
[Lucide Icon — large, muted colour]
    No vehicles in stock
    Start by adding your first vehicle.
    [+ Add Vehicle]
```

Never show a blank white area, `undefined`, `NaN`, or raw error text to the user.

---

### Form UX Rules
- Label above input (never inside input as placeholder-only label)
- Placeholder: example value or format hint (e.g. "e.g. ₹8,50,000")
- Error message: below the specific field that failed, not at the top of the form
- Helper text: grey, below label, for format or requirement hints
- Required fields: marked with `*` near the label (not asterisk inside placeholder)

---

## 19. Responsive & Accessibility Standards

### Responsive Breakpoints
| Breakpoint | Width        | Layout behaviour                              |
|------------|--------------|-----------------------------------------------|
| Desktop    | ≥ 1280px     | Full sidebar + main content + optional drawer |
| Laptop     | 1024–1279px  | Collapsed sidebar (icons + tooltip)           |
| Tablet     | 768–1023px   | Hamburger menu, stacked layout                |
| Mobile     | < 768px      | Bottom nav or drawer, single column           |

Tables on tablet/mobile: horizontal scroll with frozen first column (ID or name)

---

### Accessibility Minimums
- All interactive elements have visible focus ring (never `outline: none` without replacement)
- Colour is never the only indicator of status — always colour + icon + text label
- Font minimum: 12px (11px for micro labels only)
- Contrast ratio: minimum 4.5:1 for body text, 3:1 for large text (WCAG AA)
- Keyboard navigable: Tab through all form fields and actions
- Screen reader: all icons have `aria-label`, all tables have `<th>` with scope

---

## 20. Pre-Launch QA Checklist

### Data Integrity
- [ ] No test records in production database (clean `is_test_account` flag)
- [ ] Admin accounts excluded from performance/employee lists
- [ ] All cross-module links tested (vehicle → inquiries, inquiry → test drives, etc.)
- [ ] CSV exports match what is shown on screen (filter parity)
- [ ] GST rates in Settings are reflected in all calculation modules

### UI Polish
- [ ] All 4 colour themes tested: no broken layouts, illegible text, or invisible elements
- [ ] All 4 font pairs tested: no overflow, truncation, or layout breaks
- [ ] Dark/light theme: all icons visible in both (icon colours adapt via CSS vars)
- [ ] All status pills: correct colour for each status
- [ ] All tables: sortable columns actually sort
- [ ] All date pickers: correct format, min/max bounds where needed
- [ ] All modals: close on X, close on Cancel, close on click-outside (or not, by design)
- [ ] All toasts: appear, auto-dismiss, stack correctly when multiple

### Performance
- [ ] No unbounded data queries (all tables paginated or virtualised for 500+ records)
- [ ] Charts don't load 12 months of raw records into the browser (aggregate server-side)
- [ ] CSV exports streamed or generated server-side (not loading 10,000 rows into browser)
- [ ] Images in car stock: compressed, served via CDN if possible

### Security
- [ ] Staff cannot access Settings routes (route-level guard, not just UI hiding)
- [ ] Staff cannot export CSV (API-level check, not just hiding the button)
- [ ] Cost price and margin hidden from Staff at API level (not just display)
- [ ] Delete actions require auth token validation server-side
- [ ] No sensitive data (cost, GSTIN, loan details) in client-side URL params

---

## CHANGE LOG

| Version | Date       | Change                                              |
|---------|------------|-----------------------------------------------------|
| 2.0     | 2024-01    | Full spec created: design system, all modules, audit|
| —       | —          | Next: Implementation tracking goes here             |

---

*Document maintained by: Engineering / Product*  
*Review cycle: Before each major release*  
*Last audited: — (fill on each audit run)*
