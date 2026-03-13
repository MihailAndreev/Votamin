# Votamin V2 – Changes Log

Този файл се използва за описване на имплементирани промени след успешен тест.

## Entries

### 2026-03-13 — Mobile navigation toggle behavior fix
- Scope: Mobile navbar menu button and dashboard sidebar button open/close behavior
- Files: `src/components/navbar.js`, `src/layouts/dashboardLayout.js`
- Migration(s): None
- Validation/Test: `npm run build` (success)
- Notes: Both mobile toggles now support repeat-click close behavior and keep `aria-expanded` state in sync

### 2026-03-13 — Advanced Settings radio selection fix (mobile)
- Scope: Create Poll → Advanced Settings (`Visibility`, `Results Visibility`)
- Files: `src/components/advancedSettings.js`
- Migration(s): None
- Validation/Test: Manual test by user (mobile) — single-select behavior confirmed per section; full-card click selects the option
- Notes: Radio options were converted to full clickable labels and grouped with unique names per component instance to prevent multi-select states

### 2026-03-13 — Advanced Settings labels and mobile fit improvements (EN/BG)
- Scope: Label consistency and responsive text/layout handling in Advanced Settings
- Files: `src/i18n/locales/en.js`, `src/i18n/locales/bg.js`, `src/components/advancedSettings.js`
- Migration(s): None
- Validation/Test: Manual test by user — EN/BG labels and mobile rendering confirmed
- Notes: `Visibility` renamed to `Poll Visibility` (EN) and `Видимост на анкетата` (BG); long localized text now wraps and fits better on small screens

<!--
Шаблон за запис (добавяме само след имплементация + успешен тест):

### YYYY-MM-DD — Кратко заглавие
- Scope:
- Files:
- Migration(s):
- Validation/Test:
- Notes:
-->
