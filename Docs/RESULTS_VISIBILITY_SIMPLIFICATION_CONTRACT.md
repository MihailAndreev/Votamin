# Results Visibility Simplification Contract (V2)

## Goal

Simplify the product model to one active setting that controls access to aggregated poll results:

- Active setting: `polls.results_visibility`
- Active values:
  - `participants` (default)
  - `author`

`polls.visibility` remains in the database as legacy/deprecated for this use case and is not used as an active product setting in UI.

## Explicit separation of concepts

- Poll access (`Shared with me`, open poll view, etc.) and results access are different concerns.
- Being able to open a poll does **not** automatically grant results access.

## Results access rules

1. Poll owner can always see results.
2. Admin can always see results.
3. Participant can see results only when:
   - `results_visibility = participants`, and
   - participant has voted in that poll.
4. If `results_visibility = author`, participants can open the poll but cannot read real results data.

## UX rule for denied participants

When results are not allowed for the current participant, the `Results` section remains visible but rendered as an empty state (no charts/percentages/counts/breakdowns).

Localized copy:
- BG: `Резултатите са видими само за автора на анкетата.`
- EN: `Results are visible only to the poll author.`

## Legacy to new mapping (data normalization)

Current legacy enum values are normalized as follows:

- `after_vote` -> `participants`
- `always` -> `participants`
- `creator_only` -> `author`
- unexpected/NULL fallback -> `participants`

Rationale:
- `participants` is the new non-restrictive default mode.
- `author` is the strict owner-only mode.

## Out of scope for this step

This contract does not implement UI, RPC, RLS, or navigation changes. It only fixes the product contract and defines DB normalization behavior to be used by subsequent tasks.
