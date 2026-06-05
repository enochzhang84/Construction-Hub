## Scope

Substantial changes across Dashboard, Customers, Reports, and Project detail flow. All UI text bilingual via existing i18n.

## 1. Dashboard (`src/routes/index.tsx`)
- Remove "Recent Customers" table/section. Keep stats cards, revenue/by-trade charts, quick actions.

## 2. Customers (`src/routes/customers.tsx`)
- Add new "Recent Customers" section below existing customers table.
- Columns: Name · Phone · Project Address · Last Estimate Date · Last Status (colored badge).
- Source data: derive from `useProjects()` store — group projects by `customerName`, take the most recent by `estimateDate`.

## 3. Project store extensions (`src/lib/project-store.ts`)
Add fields to `Project`:
- `issueDate?: string` (开单日 — quote sent date, defaults to estimateDate)
- `settlementDate?: string` (结算日期)
- `paymentMethod?: "Cash"|"Check"|"Bank Transfer"|"Zelle"|"Credit Card"|"Other"`
- `customerPhone?: string`
- `discount?: number`
- `notes?: string`
- `lineItems?: Array<{id, name, qty, unit, amount}>` (basic snapshot)
- `parentProjectId?: string` (for add-on projects)
- `addonNumber?: string`

Status mapping: Localized labels via i18n. Internal status stays English enum but introduce new values? Spec uses 审核中/施工中/待结算/已完成/已取消. Map:
- 审核中 → `Estimate`
- 施工中 → `Active`
- 待结算 → `Pending Payment`
- 已完成 → `Completed`
- 已取消 → new `Cancelled`

Add `Cancelled` to `ProjectStatus` type. Update `summarizeProjects` to ignore cancelled.

Add helper: `formatDateDMY(iso)` → `DD-MM-YYYY`.
Add helper: `statusColorClasses(status)`.

## 4. Reports page (`src/routes/reports.tsx`)
Below the pipeline cards, add a comprehensive **Project Records Table** with columns:
Date | Customer (name + phone) | Project Address | Issue Date (date picker) | Status (colored dropdown) | Construction Date (date picker) | Settlement Date (date picker) | Payment Method (dropdown) | Notes (text)

- Inline editable: status, dates via shadcn Calendar/Popover, payment method via Select, notes via Input.
- Updates call `useProjects().update(id, patch)`.
- Date display format `DD-MM-YYYY`.
- Status badge color map: Estimate=blue, Active=orange, Pending=green, Completed=gray, Cancelled=red.

## 5. Project Detail page (new route `src/routes/projects.detail.$id.tsx`)
Triggered from clicking a row in `projects.$status.tsx` list (wrap row in Link).

Sections:
- Header: customer info, project address, estimate number, status badge.
- Meta grid: Issue date, Construction date, Settlement date, Payment method, Notes (editable).
- Original Estimate panel: amount, discount, final amount, line items snapshot.
- Add-on Projects section: list of children (`parentProjectId === this.id`), each card shows addon number, date, items, amount, status.
- Button **[+ 新施工项目 / + New Add-on Project]** → navigates to `/projects/detail/$id/addon`.

## 6. Add-on Estimate page (new route `src/routes/projects.detail.$id.addon.tsx`)
- Layout mirrors `/estimates` (left categories, middle items, right detail panel).
- Reuse the existing components if possible by extracting; but for scope, render a simplified variant using the existing Estimates UI building blocks via copy.
- Header: "新增施工项目 / New Add-on Project" + parent info (customer, address, project #, estimate #).
- On Save: create new Project with `parentProjectId = $id`, `addonNumber = ADDON-<seq>`, status=Estimate, then navigate back to detail page.

Scope note: Full duplication of estimates UI is large. Implement a simpler add-on form (pick category/item from existing data, qty, unit price → amount, multiple lines, save) rather than full triple-pane. Header makes it clear it's an add-on entry form. This keeps scope manageable while meeting the linkage requirement.

## 7. Projects list page (`src/routes/projects.$status.tsx`)
- Make each row a `<Link to="/projects/detail/$id" params={{id: p.id}}>`.
- Filter out cancelled where appropriate.

## 8. i18n keys (`src/lib/i18n.tsx`)
Add keys for all new labels: status names, payment methods, table headers, buttons, section titles.

## 9. Pipeline cards already in Reports — keep them; the new records table goes below.

## Out of scope (not requested now)
- Full triple-pane editor reuse for add-on (using simplified line entry instead, will note for user).
- PDF changes.
- Persisting line items from current Estimates store into Project records (would need bigger refactor — add-on entries will persist their own line snapshots).
