# Buzz Filing Enterprise UI Aesthetics Specification

Version: 1.0
Status: Approved direction for the next system

## 1. Product character

Buzz Filing should feel like a trusted operations platform for business formation, not a generic dashboard.

Design attributes:

- Trustworthy: calm surfaces, clear status, transparent activity history.
- Operational: dense enough for staff, never visually noisy.
- Premium: restrained red brand accents, strong typography, excellent spacing.
- Human: helpful explanations, plain language, visible ownership of every action.
- Enterprise-ready: role-aware navigation, auditability, accessibility, and predictable states.

Avoid:

- Neon gradients, excessive glassmorphism, decorative blobs, emoji icons.
- Large empty hero areas inside operational screens.
- Red used for ordinary actions; reserve it for brand emphasis, errors, and urgent states.
- Hidden workflow rules or unexplained status changes.

## 2. Brand foundation

### Color tokens

Use semantic tokens rather than hardcoded colors in components.

| Token | Light value | Purpose |
|---|---|---|
| Background | `#F6F7F9` | Application canvas |
| Surface | `#FFFFFF` | Cards, tables, dialogs |
| Surface muted | `#F0F2F4` | Secondary panels, disabled areas |
| Ink | `#151719` | Primary text |
| Ink muted | `#66707A` | Supporting text |
| Border | `#DDE2E6` | Dividers and card edges |
| Brand red | `#E31B23` | Primary brand accent, key CTA |
| Brand red dark | `#B8141A` | Hover and pressed brand states |
| Success | `#17804F` | Completed, approved, paid |
| Warning | `#A86400` | Waiting, at risk, expiring |
| Danger | `#C62828` | Failed, rejected, destructive action |
| Info | `#2867A6` | Informational state |

Use no more than three accent colors in one view. Status colors must include text labels or icons; never rely on color alone.

### Typography

- Primary family: Geist Sans or Inter.
- Optional display family: Geist Sans only; avoid mixing decorative fonts into operational screens.
- Page title: 30–36px, weight 650–700.
- Section title: 18–22px, weight 650.
- Body: 14–16px, line-height 1.5.
- Dense table text: 13–14px.
- Metadata: 12–13px, muted color.
- Use tabular numerals for prices, dates, IDs, and analytics.

### Shape and elevation

- Base radius: 10px.
- Small controls: 7–8px.
- Large panels: 14px.
- Border-first design; use shadows only for menus, dialogs, and floating actions.
- No heavy gradients. Use subtle surface contrast instead.

## 3. Layout system

### Global shell

Desktop:

- Fixed left sidebar: 248px.
- Main content: `minmax(0, 1fr)` with max width around 1440px.
- Page padding: 28–40px.
- Header height: 64–72px.

Tablet:

- Collapsible sidebar or icon rail.
- Page padding: 20–28px.

Mobile:

- Bottom navigation or drawer navigation.
- Page padding: 16px.
- Tables become cards or horizontally scrollable regions.
- Primary action remains visible without requiring desktop layout.

Use Flexbox for one-dimensional layouts and Grid for dashboard matrices. Prefer `gap-*` spacing and semantic design tokens.

### Page anatomy

Every primary page should follow:

1. Breadcrumb or context label.
2. Page title and one-sentence purpose.
3. Primary action aligned to the right.
4. KPI or status strip when useful.
5. Main content panel.
6. Empty, loading, error, and success states.

## 4. Admin dashboard direction

The admin dashboard is an operations cockpit.

### Navigation

Primary sections:

- Overview
- Orders
- Workflow board
- Documents
- Customers
- Messages
- Compliance
- Reports
- Billing
- Settings

Navigation should show:

- Active state with a red left rule and tinted background.
- Notification counts only when actionable.
- Role-based visibility.
- Persistent support/help access.

### Admin overview

Top row:

- Orders requiring action.
- SLA risk.
- Documents awaiting review.
- Revenue or completed orders.

Main row:

- Workflow distribution chart.
- Recent activity timeline.
- Urgent queue.

Use charts sparingly. Every chart must answer a decision-making question and include an accessible data table or summary.

### Order operations center

Recommended layout:

- Search and filters in a sticky toolbar.
- Saved views: My queue, At risk, Waiting on customer, Completed today.
- Table columns: customer, company, service, current milestone, owner, SLA, status, updated.
- Row click opens a detail workspace rather than a confusing sequence of modals.
- Bulk actions require confirmation and display affected count.

Status badges:

- Pending: neutral.
- Processing: info.
- Waiting on customer: warning.
- Blocked: danger.
- Completed: success.
- Cancelled: muted.

### Order detail workspace

Use a two-column layout:

- Main: progress, activity timeline, documents, customer-visible updates.
- Side rail: status, owner, SLA, payment, quick actions.

The side rail should remain readable at desktop widths and collapse below the main content on mobile.

## 5. Customer dashboard direction

The customer dashboard should reduce uncertainty.

### Customer home

Top section:

- Friendly greeting.
- One prominent order status card.
- Current step and next action.
- Estimated completion date when available.

Main sections:

- Progress timeline.
- Documents requiring upload or approval.
- Messages from the filing team.
- Billing and invoice history.
- Help and support.

### Progress design

Use a vertical timeline on desktop and mobile.

Each step includes:

- Step name.
- Plain-language description.
- Date completed or expected date.
- Owner or responsible team.
- Attached document or message when relevant.

Never present a completed final milestone as an order completion unless the actual order status is `completed`.

### Completion modal

Show only after the server confirms order status `completed`.

Include:

- Clear success heading.
- Company name.
- Completion date.
- What is now available.
- Download/view documents action.
- Next recommended action.
- Close button with accessible label.

Do not show it again after dismissal unless the user explicitly opens completion details.

## 6. Workflow and status language

Use consistent nouns and verbs:

- Order: the customer purchase and service record.
- Milestone: one operational step.
- Document: an uploaded or generated file.
- Task: an internal staff assignment.
- Message: customer-visible communication.
- Note: internal-only communication.

Status copy should explain meaning:

- `Pending`: We have received your order and will begin shortly.
- `Processing`: Our team is actively working on this step.
- `Waiting on customer`: We need information or a document from you.
- `Blocked`: This step cannot continue until an issue is resolved.
- `Completed`: Your order has been completed.

## 7. Component rules

Use shadcn/ui primitives and compose them consistently:

- `Sidebar` for navigation.
- `Card` for grouped information.
- `Table` for operational lists.
- `Badge` for statuses.
- `Tabs` for detail sections.
- `Dialog` or `Sheet` for focused actions.
- `Alert` for important explanations.
- `Empty` for no-data states.
- `Skeleton` for loading states.
- `Sonner` for lightweight confirmation feedback.
- `Command` inside a dialog for global search.
- `Progress` for milestone completion.
- `Tooltip` only for supplemental context, never essential instructions.

Composition rules:

- Every dialog has an accessible title.
- Every avatar has a fallback.
- Every table has a mobile strategy.
- Every async action has pending, success, and error feedback.
- Every destructive action requires confirmation.
- Use semantic color tokens, not arbitrary utility colors.
- Use icon labels or screen-reader text for icon-only buttons.

## 8. Forms and uploads

Forms should feel guided rather than administrative.

- Group related fields with visible labels.
- Explain why sensitive information is needed.
- Show inline validation near the field.
- Preserve entered data after recoverable errors.
- Display upload limits before upload begins.
- Show file type, file size, upload progress, virus/scanning state, approval state, and rejection reason.
- Never use a color-only validation signal.

## 9. Motion and interaction

Motion should communicate state, not decorate.

- Page transitions: subtle fade or slide under 180ms.
- Dialogs: short scale/fade.
- Status changes: brief highlight, then settle.
- Avoid looping animations except loading indicators.
- Respect `prefers-reduced-motion`.
- Do not delay critical actions with animation.

## 10. Accessibility requirements

Target WCAG 2.2 AA.

- Keyboard navigation for all actions.
- Visible focus rings.
- Minimum 44px touch targets.
- Sufficient text contrast.
- Logical heading hierarchy.
- Proper labels and descriptions for fields.
- Announce async status changes to assistive technology.
- Do not use color as the only status signal.
- Preserve focus when dialogs open and close.
- Provide alternatives for charts and dense tables.

## 11. Responsive behavior

At widths below 768px:

- Collapse sidebar.
- Stack header actions.
- Convert KPI grid to two columns, then one.
- Convert order table rows to cards or enable intentional horizontal scrolling.
- Move detail side rail below the main content.
- Keep primary action sticky only when it does not obscure content.

At widths below 480px:

- Use one-column cards.
- Shorten non-essential metadata.
- Keep status, next action, and support access above the fold.

## 12. Content and tone

Use direct, reassuring language.

Good:

- “Your EIN application is being reviewed.”
- “Upload the signed document to continue.”
- “Your order is complete.”

Avoid:

- “Something went wrong” without a next action.
- Technical database terminology in customer UI.
- Excessive exclamation points.
- Ambiguous labels such as “Proceed” or “Submit” without context.

## 13. Enterprise features that fit this visual system

The next system can extend this foundation with:

- Configurable workflow builder.
- Organization accounts and role-based access.
- SLA timers and escalation queues.
- Immutable activity and audit logs.
- Document intelligence and review queues.
- Compliance calendar.
- Partner/reseller portal.
- API and webhook management.
- Billing and usage analytics.
- Message center with email and SMS history.

Each feature should reuse the same shell, status language, timeline, audit patterns, and responsive rules.

## 14. Technical implementation rules

- Prefer server-rendered data for initial dashboard content.
- Use SWR for client-side data that needs synchronized refresh.
- Do not use localStorage for authoritative business data.
- Keep order status server-authoritative.
- Scope every user query by authenticated user or organization.
- Validate all form and API inputs.
- Use idempotency for emails, payments, and workflow transitions.
- Log structured events with request IDs, never customer secrets.
- Keep third-party delivery failures retryable and visible.
- Add response security headers at the framework configuration layer.

## 15. Definition of done for a polished screen

Before shipping a screen, verify:

- It has a clear purpose and primary action.
- Loading, empty, error, success, and permission states exist.
- It works at desktop, tablet, and mobile widths.
- Keyboard and screen-reader behavior are usable.
- Status language matches the system vocabulary.
- Destructive actions are confirmed.
- Real data is scoped and validated.
- No decorative element competes with the workflow.
- The screen uses existing shadcn/ui components where appropriate.
- Browser verification covers the primary user path.

## 16. Visual summary

The final aesthetic should feel like:

> A calm, premium operations platform with Buzz Filing’s red signature, excellent information hierarchy, transparent progress, and the confidence of a serious enterprise service.

Use this document as the visual and interaction contract for future admin and customer dashboard work.
