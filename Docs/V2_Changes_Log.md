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

### 2026-03-13 — Mobile navbar language switcher dropdown fix
- Scope: Correct functionality of the language dropdown explicitly in the mobile navbar without closing or breaking mobile menu behaviors
- Files: `src/components/navbar.js`
- Migration(s): None
- Validation/Test: Manual test by user — dropdown opens correctly, language switches properly, updated UI to display flags without text
- Notes: Removed Bootstrap's strict dropdown API (`data-bs-toggle`), replaced with custom JavaScript event handling logic (`classList.toggle('show')`) and custom click-outside-to-close behavior

### 2026-03-13 — Public Poll layout improvements and Success View cleanup
- Scope: Restyled the inviter text as a pill badge, reduced logo size, and simplified the layout on successful vote.
- Files: `src/pages/pollPublic/pollPublic.js`, `src/pages/pollPublic/pollPublic.css`
- Migration(s): None
- Validation/Test: Tested locally, layout structure applies modern badge style for inviter, explicit separation from title, and success state hides title/desc/inviter.
- Notes: Used `hasVoted` state to toggle sections. Replaced plain paragraph with a bordered badge (`vm-public-inviter-badge`) with horizontal separation.

### 2026-03-13 — Added sub-instructions for poll options in Public Vote
- Scope: Form for voting (Public Page). Added short descriptive text explaining the rules based on the poll's `kind`.
- Files: `src/pages/pollPublic/pollPublic.js`, `src/pages/pollPublic/pollPublic.css`, `src/i18n/locales/bg.js`, `src/i18n/locales/en.js`
- Migration(s): None
- Validation/Test: Tested locally, mapped `poll.kind` via `publicPoll.instructions_...` object per language (bg/en).
- Notes: Descriptions appear clearly right under the title/main description, stylized as `.vm-public-poll-instruction`.

### 2026-03-13 — Swapped formatting for poll description and poll instructions
- Scope: Form for voting (Public Page). Description text and dynamic instruction text style swapped.
- Files: `src/pages/pollPublic/pollPublic.js`, `src/pages/pollPublic/pollPublic.css`
- Migration(s): None
- Validation/Test: Tested locally; instruction is in italics and parentheses, and description is now more prominent (`fw-medium` without `text-muted small`).
- Notes: Ensured readability and updated classes respectively.

<!--
Шаблон за запис (добавяме само след имплементация + успешен тест):

### YYYY-MM-DD — Кратко заглавие
- Scope:
- Files:
- Migration(s):
- Validation/Test:
- Notes:
-->
