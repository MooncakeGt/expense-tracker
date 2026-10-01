<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Expense Tracker — Agent Instructions

## 1. Project Overview

This is a browser-based personal finance tracker built with Next.js 16 App Router, React 19, JavaScript, Bootstrap 5, Chart.js, `react-chartjs-2`, PapaParse, Zod, and browser `localStorage`.

There is no backend, database, cloud sync, or authentication. The application must remain compatible with a GitHub Pages static export. The production base path and asset prefix are `/expense-tracker`.

Do not introduce server-only functionality unless explicitly requested.

## 2. Required Verification

Before considering an implementation complete, normally run:

```bash
npm test
npm run lint
npm run build
```

All commands must pass. The suite currently contains more than 140 tests and should grow rather than shrink. Never remove or weaken tests merely to make a change pass.

If interactive browser testing cannot be performed, state that explicitly instead of claiming it was verified.

## 3. Next.js and Deployment Constraints

This project may use Next.js APIs and conventions that differ from prior versions. Before changing Next.js configuration, routing, rendering, CSS loading, metadata, or file conventions, read the relevant guide under `node_modules/next/dist/docs/` as required by `AGENTS.md`.

Deployment uses `.github/workflows/deploy.yml`. Preserve that workflow and `next.config.ts`. Production must continue generating static pages.

Do not introduce API routes, runtime server actions, server databases, filesystem persistence, or backend-dependent authentication unless specifically requested.

## 4. Persistence

App-owned `localStorage` keys are centralized in `src/app/utils/appStorage.js`:

```text
expenses
accounts
transfers
customCategories
categoryIconOverrides
budgets
recurringRules
recurringTransfers
savingsGoals
savingsGoalContributions
recurringSavingsGoalContributions
fiftyThirtyTwentySettings
```

When adding a persisted dataset:

1. Add Zod validation and safe recovery.
2. Include it in Full Backup/Restore when appropriate.
3. Add it to `APP_STORAGE_KEYS` so Reset Entire App removes it.
4. Add tests.
5. Treat missing data from older versions as a supported case.

Never blindly trust or parse persisted JSON. Recover valid records from partially corrupt arrays where practical. Preserve hydration-safe initialization so an empty initial render cannot overwrite saved data.

## 5. Core Accounting Model

Keep transactions, transfers, savings contributions, recurring rules, and forecast events as separate concepts.

### Transactions

Transactions represent actual income or expense:

```js
{
  id,
  description,
  tag,
  amount,
  type,
  date,
  accountId
}
```

Ordinary transactions affect income, expenses, net, account balances, budgets, spending charts, and 50/30/20 classification according to their type.

### Transfers

Transfers represent money movement between accounts. A RM500 transfer from Maybank to Savings reduces Maybank and increases Savings, but it is neither income nor expense.

Transfers must not affect income, expenses, spending budgets, category spending, or 50/30/20 totals. Store them as transfer records; never create fake expense transactions for transfers.

### Savings Goal Contributions

Savings contributions are separate financial activity and are not ordinary expenses. An unlinked contribution reduces its source account, increases goal progress, and can appear in unified Transaction History and Calendar activity.

It must not affect expense totals, budgets, category spending, ordinary expense charts, or 50/30/20 allocation.

Savings contributions use the system-only category ID `contribution`, displayed as `🎯 Contribution`. Do not duplicate them into normal transaction storage.

### Linked Savings Transfers

When a contribution is backed by a real transfer, the transfer owns the account movement. Do not also deduct the contribution. A RM500 linked contribution must never reduce the source account by RM1,000.

## 6. Unified Financial Activity

`src/app/utils/financialActivity.js` provides a derived display layer that can combine transactions and savings contributions in Transaction History without combining their persistence models.

Preserve this distinction. Transfers and forecast events do not become transactions merely to appear in a UI.

## 7. Accounts

The permanent fallback account has stable ID `general`. Users may change its display name, type, and opening balance, but its ID must never change. It cannot be archived or deleted and remains the fallback for legacy records without `accountId`.

Account types are defined in `src/app/utils/accounts.js`. Liability types currently include:

```text
credit-card
personal-loan
student-loan
vehicle-loan
mortgage
other-debt
```

Available Balance comes from non-liability account balances. Total Debt comes from positive outstanding liability balances, not expense categories such as Debt & Loans. Preserve account-specific transaction, transfer, and contribution treatment to avoid double counting repayments or linked transfers.

## 8. Recurring Activity

Recurring activity has three separate persisted models:

```text
Recurring Transactions
Recurring Transfers
Recurring Savings Contributions
```

The UI combines these under Recurring Activity, but their schemas and storage remain separate.

- A due recurring transaction creates a validated transaction.
- A due recurring transfer creates a transfer.
- A due recurring savings contribution creates a contribution and may create a linked transfer.

Never create future occurrences as actual records. Preserve duplicate prevention fields such as `processedThrough`, rule IDs, and `recurringOccurrenceDate`. Opening or refreshing the app must not generate an occurrence twice, including after an individual generated record has been deleted.

Pausing, resuming, editing, and deleting a rule affect future generation; historical generated records remain independent.

## 9. Recurrence Date Semantics

Use the pure helpers in `src/app/utils/recurring.js` and supply an explicit `today` to test date behavior. Preserve anchored recurrence:

```text
Jan 31 monthly → Feb end → Mar 31
Feb 29 yearly → Feb 28 in non-leap years → Feb 29 in leap years
```

Do not replace recurrence calculations with naive millisecond or fixed-day arithmetic. Avoid timezone shifts for `YYYY-MM-DD` values.

## 10. Savings Goals

Savings Goals have separate goal records, contribution records, and recurring contribution rules. Goals can be created, edited, archived, restored, and permanently deleted.

Deleting a goal must remove or safely handle goal-specific contribution and recurring-rule records without leaving orphan references. Preserve real historical transfers created by contributions; deleting a goal must not silently erase money-movement history.

## 11. Forecast

Forecast output is derived and must never be persisted as actual financial activity or mutate account balances.

Current baseline rules:

- Projected income uses actual income from the most recent month containing income.
- Projected expenses use current-year actual expenses divided by the number of current-year months containing at least one actual expense.
- Zero-spending months are excluded from the expense divisor.
- Transfers, savings contributions, and forecast-only events are excluded from those baselines.
- Recurring expenses are not added on top of the aggregate expense baseline.

Projected savings is projected income minus projected expenses. The 12-month Projected Available Balance trend carries this net amount forward from current available balance. Cash-Flow Forecast currently presents the next month. Savings Goal forecasts and what-if calculations remain derived.

Account-specific projections may use activity only when its account is known. Never assign aggregate projected spending to an arbitrary account.

## 12. Categories

The category system in `src/app/utils/tags.js` supports built-in categories, custom categories, main categories, subcategories, legacy/imported values, and system-only categories.

Preserve stable IDs. Display names, icons, or hierarchy presentation must not rewrite historical IDs. Unknown non-empty imported categories must remain displayable, filterable, and exportable. Blank tags normalize through shared helpers to the established Other behavior.

### Main Category and Subcategory

Transactions store the stable category/subcategory ID in `tag`; the parent is derived through category metadata. Add, Edit, and Recurring forms use side-by-side Main Category and Subcategory selectors on desktop, stacking on mobile. Subcategory choices depend on type and selected main category.

A custom category has `mainCategoryId` and acts as a selectable subcategory within that parent. Do not invent a second independent category configuration.

### Preset Customization

Canonical built-in definitions remain unchanged in source. User presentation overrides are stored in `categoryIconOverrides`, keyed by built-in category ID. An override may contain:

```js
{
  customName: "Eating Out",
  hidden: true,
  iconType: "image",
  imageData: "data:image/webp;base64,..."
}
```

Built-ins may be renamed, hidden/restored, assigned an image icon, and reverted. Hidden categories disappear from new selections but remain resolvable for historical records. Never change their IDs or delete canonical definitions.

### Custom Categories

Custom categories support stable `custom-...` IDs, type, emoji or image icon, keywords, `mainCategoryId`, 50/30/20 classification, archive/restore, and permanent deletion when unreferenced.

Before deletion, check transactions, recurring rules, budgets, 50/30/20 overrides, and other relevant records. Do not leave orphan references. Removing a custom category also removes its embedded image metadata because the image is stored in that category record.

### Category Images

Reuse `CategoryIcon`, `CategoryImagePicker`, `categoryImages.js`, and `categoryIconOverrides.js`.

Supported uploads are PNG, JPEG, and WebP. Source files are limited to 5 MB, center-cropped and resized to 128×128, encoded as WebP around 0.82 quality where supported, and capped at 150,000 data URL characters. Render with `object-fit: cover`. If an image fails, fall back to the emoji. Native `<option>` elements may use emoji because they cannot render React image components.

Do not create a second image-processing pipeline.

### System-Only Categories

Respect `systemOnly`. Internal categories such as `contribution` must not appear in ordinary Add/Edit/Recurring transaction selection unless a specific historical display path explicitly includes them.

## 13. Dashboard and Periods

Dashboard supports Monthly and Yearly modes. Its calculations always use all eligible records for the selected period and remain independent from Transaction History filters.

When prior values do not provide a useful divisor, use the established messages:

```text
No prior-month baseline
No prior-year baseline
```

Never display `NaN`, `Infinity`, or misleading percentages.

Use the shared `PeriodNavigator` and shared mode-toggle styles. Previous/next arrows are neutral white controls with dark text and a visible border. Today/This Year remains readable in current and disabled states. Active Monthly/Yearly controls use a filled primary background with white text; inactive controls use a light background, dark text, and visible border.

## 14. Transactions UI

Transactions is a records workflow, not a second dashboard. It includes Monthly/Yearly period navigation, a compact period summary, Add Transaction, search and filters, Transaction History, and Recurring Activity.

Administrative Accounts, Categories, Transfers, application data, and reset controls belong in Settings or Data.

Preferred transaction form layout:

```text
Description (full width)
Main Category | Subcategory
Amount        | Type
Date          | Account
```

Columns stack on mobile. Preserve labels, validation, searchable selector behavior, and consistent input geometry.

Transaction History advanced filters use Type, Category, Account, and Sort on the first row, with From and To on the second row where space permits. Period selection is the primary browsing context and is not an active-filter count. Filters apply inside the selected month or year.

Editing a transaction date may remove it from the visible period; do not automatically navigate. Add, edit, delete, recurring generation, and imports must update derived summaries immediately.

## 15. Settings and Danger Zone

Settings owns administrative configuration for categories, accounts, transfers, data access, and full reset. Action buttons should normally align at the bottom-left of their cards.

Transfer management is visible when at least two active accounts exist or transfer history exists. Current transfer logic allows active account types to participate; preserve any future centralized eligibility helper rather than duplicating restrictions.

Reset Entire App must use `resetAppStorage` and the centralized `APP_STORAGE_KEYS`. Remove only app-owned keys, then restore the required General account. Never call `localStorage.clear()` because the origin may contain unrelated data.

## 16. Confirmation Dialogs

Use `useAppDialog()` from `src/app/components/ConfirmationModal.js`; the app-level provider is `AppDialogProvider`.

Do not use `window.confirm()` or `alert()`. The shared dialog provides confirmation and notification flows with a single portal/backdrop, focus entry, focus trap, Escape cancellation, and focus restoration. Destructive actions require explicit confirmation with clear copy and a danger action label.

## 17. Dropdowns and Form Controls

Searchable dropdowns must overlay surrounding content rather than changing document flow. Use a positioned parent and absolute popup with suitable z-index, aligned width, rounded clipped corners, a bounded scroll area, upward opening when needed, click-outside closing, and keyboard navigation.

Native selects and custom triggers should match Bootstrap controls. Current shared geometry is approximately:

```text
height: 2.375rem
border-radius: 0.375rem
border: 1px
font-size: 1rem
```

Do not use broad global rules that alter unrelated Bootstrap controls or top navigation.

## 18. Navigation and Layout

The current top-level tab order and labels are:

```text
Dashboard
Transactions
Calendar
Savings
Budget
Forecast
Data
Settings
```

These correspond to Savings Goals, the 50/30/20 planner, and Import/Export respectively. Keep each tab equal width when space permits. On narrow screens preserve horizontal scrolling, centered readable labels, and no internal vertical scrollbar. Mounted inactive panels use `hidden` so their state remains intact without affecting layout.

Preserve the `app-shell`, `app-content`, and `app-panel` structure. Avoid adding top-level `100vw`, fixed `100vh`, `overflow-y: scroll`, or large duplicate Bootstrap margins/padding without measuring page overflow. Long pages must scroll normally; short pages should not gain an unnecessary scrollbar.

## 19. Calendar and Date Handling

Calendar distinguishes Income, Expenses, Transfers, and Savings allocations, including separate symbols for transfer and savings activity. Contributions must not inflate expenses.

Stored financial dates are `YYYY-MM-DD`. Prefer string-based year/month comparisons or controlled calendar helpers. Do not parse date-only values in ways that can move them to another day or month because of timezone conversion.

## 20. Budgets and 50/30/20

Budgets are month-specific and compare against eligible actual expenses. Transfers and savings contributions do not consume overall or category spending budgets.

50/30/20 uses Needs, Wants, and Savings. Classification priority is:

1. Explicit user override.
2. Custom category classification.
3. Built-in default classification.
4. Unassigned fallback.

Savings Goal contributions are not ordinary 50/30/20 spending. Preserve existing budget status thresholds and calculations. Keep value and status on one row when practical, allowing responsive wrapping.

## 21. Charts

Reuse centralized chart colors in `src/app/components/charts/chartColors.js`. Income is green-like and expenses red-like. Category colors should be deterministic. Do not rely on color alone; retain headings, legends, tooltips, summary cards, and textual breakdowns.

Charts are client-safe components and must remain compatible with static rendering. Derived chart data is never persisted.

## 22. Import, Export, and Backup

The Data tab is the dedicated Import/Export page. CSV supports spreadsheet interoperability and individual datasets. Full JSON Backup is the authoritative complete backup because it preserves stable IDs, relationships, recurrence checkpoints, category overrides, budgets, and settings.

CSV does not preserve every internal relationship. Full restore must validate schemas and references before mutating app state. Preserve recurrence checkpoints so restored rules do not regenerate historical events.

Exports retain UTF-8 BOM where currently used and protect spreadsheet cells beginning with formula characters such as `=`, `+`, `-`, and `@` without changing stored application data.

### Transaction CSV Import

Transaction CSV supports Merge, Replace, Skip likely duplicates, and Import all valid rows.

- Merge preserves existing transactions and appends selected valid rows.
- Replace uses the existing replacement flow.
- Invalid rows are excluded and reported.
- Import all valid rows is the escape hatch for legitimate identical records.

The likely-duplicate fingerprint includes date, type, numeric amount, normalized description, canonical category ID, and canonical account ID. Description normalization trims, lowercases, and collapses repeated whitespace.

CSV account resolution order is:

1. Exact stable account ID.
2. Unique case-insensitive account name.
3. General fallback with a warning.

Ambiguous names must not silently select an account. For Merge, duplicate detection is rechecked against current transaction state immediately before import. Within one CSV, the first identical row remains eligible and later identical rows may be skipped.

## 23. Unicode and Encoding

Keep source files UTF-8 and never introduce mojibake such as `âˆ’`, `â€œ`, `â€`, or `ðŸ`. Unicode escapes are acceptable for fragile punctuation and symbols:

```js
"\u201C"
"\u201D"
"\u2014"
"\u2212"
```

When editing user-visible strings, scan nearby code for suspicious `Â`, `Ã`, `â`, or `ðŸ` sequences. Fix source literals only; do not rewrite legitimate user-entered persisted text without an explicit migration requirement.

## 24. Responsive UI and Accessibility

Important layouts should work at approximately 1920, 1366, 1024, 768, 390, 375, and 320 pixels without page-level horizontal overflow. Controls may wrap or stack on small screens.

Preserve visible labels, semantic buttons, keyboard navigation, visible focus, accessible dialog behavior, suitable ARIA labels for symbols/icons, and meaning that does not depend on color alone. Maintain usable touch targets.

Prefer existing Bootstrap and scoped application CSS. Reuse shared components and patterns before adding new global selectors.

## 25. Editing Existing Code

Before implementation:

1. Inspect the relevant current code and tests.
2. Reuse existing helpers, schemas, and components.
3. Check whether the concept already exists elsewhere.
4. Avoid duplicate models, category lists, persistence logic, or calculations.
5. Preserve backward compatibility and stable IDs.
6. Keep changes focused; do not rewrite working areas for a small request.

Do not fix presentation requirements by corrupting financial semantics. In particular, do not turn contributions or transfers into expenses, assign unknown forecast spending to arbitrary accounts, mutate stable IDs for labels, or delete canonical categories to implement hiding.

## 26. Cleanup and File Deletion

Before deleting a file, search static imports, dynamic references, styles, tests, metadata conventions, and build use. Verify tests and build afterward.

Do not remove `.github/workflows/deploy.yml`, `next.config.ts`, `src/app/icon.png`, tests, import/export utilities, backup/reset utilities, or feature modules unless explicitly requested and confirmed unused.

Tailwind is not part of the active UI stack. Bootstrap is the primary styling framework.

## 27. Backward Compatibility

Users may have historical localStorage data and exported backups. Schema extensions should normally make new fields optional, provide safe defaults, recover older records, preserve stable IDs, and preserve unknown historical categories.

Avoid destructive migrations unless explicitly required. Validation establishes structural safety; category display normalization must not turn valid unknown imported categories into Other.

## 28. Agent Workflow and Reporting

For implementation tasks: inspect first, make the focused change, test it, and provide a concise report covering files changed, behavior, material edge cases, tests, lint, and build.

Do not repeatedly request confirmation when the requested behavior is clear. For audits, do not modify code unless the user explicitly asks for changes; report findings first.

## 29. Definition of Done

Unless explicitly stated otherwise, a task is complete only when:

```text
requested behavior works
financial semantics remain intact
backward compatibility is preserved
tests pass
lint passes
build passes
static export remains functional
```
