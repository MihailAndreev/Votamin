# Create Poll -- MVP Specification (Votamin)

## 0) Purpose

Create Poll is available only for authenticated users. It allows fast
poll creation with optional advanced configuration.

------------------------------------------------------------------------

## 1) Wizard Flow (4 Steps)

1.  Create
2.  Preview
3.  Save
4.  Share

Fast path allowed:
- Create → Save → Share
- Create → Share (auto-save on publish)

------------------------------------------------------------------------

## 2) Step 1: Create

### Poll Types (MVP -- single question only)

-   Single Choice
-   Multiple Choice
-   Rating
-   Numeric

> **V2:** Slider, Image Poll

### Common Fields

-   Question (required)
-   Description (optional)

### Type-Specific Fields

#### Single Choice

-   Minimum 2 options
-   Add / Remove option

#### Multiple Choice

-   Minimum 2 options
-   Add / Remove option

#### Rating

-   Fixed 1--5 scale (MVP)
-   Implemented as 5 text options ("1", "2", "3", "4", "5")

#### Numeric

-   Optional Min
-   Optional Max

------------------------------------------------------------------------

## 3) Advanced Settings (Collapsible)

1.  Visibility
    -   Public
    -   Private (accessible by link only; uses share codes)
2.  Show Results
    -   After vote
    -   Always
    -   Only creator
3.  End Date & Time (optional)
    -   Displayed as: "Closes on 25 May 2026, 18:00"
4.  Theme
    -   Default + predefined themes

------------------------------------------------------------------------

## 4) Save as Draft

-   Draft polls cannot be shared
-   Draft polls are not publicly accessible
-   Visible only in "My Polls"

Buttons:
- Save as Draft
- Preview
- Publish

------------------------------------------------------------------------

## 5) Preview

Shows:
- Question
- Options / Controls
- Theme
- Closing text if applicable

------------------------------------------------------------------------

## 6) Save / Publish Logic

Publish:
- Validate
- Save poll + question + options
- Status = **open**

Save Draft:
- Status = **draft**

------------------------------------------------------------------------

## 7) Share (Open Polls Only)

Displays:
- Generated link
- Copy button

Draft polls cannot be shared.

------------------------------------------------------------------------

## 8) Visibility Rules

**Public:**
- Voting is always via direct link
- Closed public polls may appear on Home as showcase examples
- Open public polls are **not** listed on Home

**Private:**
- Not visible on Home (regardless of status)
- Accessible only by share link (share code)
- Voting requires login

------------------------------------------------------------------------

## 9) Voting Rules

-   Poll page accessible to everyone (read-only for unauthenticated)
-   Only authenticated users can vote
-   One vote per user (no multiple voting option)

------------------------------------------------------------------------

## 10) Close Rules

-   Auto-close at End Date & Time (enforced via `ends_at` check in
    `poll_is_open_for_voting`; frontend displays "Expired" visually)
-   Manual close available (owner sets status = closed)
-   Closed polls cannot accept votes

> **Note (MVP):** The database `status` column is not automatically
> updated by a cron job. The function `poll_is_open_for_voting` blocks
> votes after `ends_at`, and the frontend reads `ends_at` to display
> the correct state. A pg\_cron sync may be added in V2.

------------------------------------------------------------------------

## 11) Architecture Notes

-   Database future-ready for multiple questions
-   UI currently supports only one question
-   Poll types implemented modularly (plugin-like structure)
-   Translation-ready (EN only for MVP)
-   Poll kind enum values (MVP): `single_choice`, `multiple_choice`,
    `rating`, `numeric`
-   Poll kind enum values (V2): `slider`, `image`

------------------------------------------------------------------------

End of Create Poll MVP Specification