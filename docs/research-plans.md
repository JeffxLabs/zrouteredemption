# Research plans: save, import and export

The research page continues to autosave the active working plan in this browser.
The **Saved plans** panel adds named snapshots and portable JSON files.

- Enter a **Plan name**, then **Save plan** to store a named copy locally.
- Select a saved plan and choose **Load plan** to restore it. You are asked before replacing the active plan.
- Saving the same name asks before overwriting that snapshot.
- **Delete plan** deletes only the selected snapshot, not the active working plan.
- **Copy plan** (in the floating **+** actions menu, bottom-right, alongside Plan whole tree, Mark tree maxed and Reset tree) copies a shareable URL containing all trees, current/target levels, research speed, selected tree, cost scope and plan name. Opening the link asks before replacing the active plan. The data is encoded in the URL fragment, not uploaded to a server; anyone with the link can read the plan. Full-account plans are supported without a URL-shortening service.
- **Export JSON** downloads the active plan, including every tree (regardless of the selected cost scope), current and target levels, research speed, selected tree and cost scope.
- **Import JSON** validates an exported file, then asks before replacing the active plan. Use **Save plan** afterwards to keep an additional named copy.

Saved plans are local to the browser, not cloud-synced. Export files before clearing browser storage or changing devices. Import that file on another device to continue planning. If storage is unavailable or full, named saves report failure; file export still works.

## File format

```json
{
  "format": "zroute-research-plan",
  "version": 1,
  "name": "T10 plan",
  "state": {
    "plan": {
      "11001": { "c": 2, "t": 7 },
      "11023": { "c": 0, "t": 1 }
    },
    "tree": 11,
    "speed": 125,
    "scope": "all"
  }
}
```

`c` is the current level and `t` is the target level. Omitted technologies default to zero. Files use technology IDs rather than localized names. Costs and benefits are recalculated from site data, never trusted from an imported file.

Imports accept files up to 1 MB. Unknown technology/tree IDs, unsupported versions, non-integer or out-of-range levels, targets below current levels, and invalid research-speed/scope values are rejected without changing the active plan.

Checks: `node tools/check_research_plans.mjs`, `node tools/check_research_effects.mjs`, and `node tools/check_localization.js`.
