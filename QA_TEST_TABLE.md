# End-to-End Test Table

| ID | Area | Role | Steps | Expected Result |
|---|---|---|---|---|
| T01 | Login | Admin | Login with `admin@demo.local` | Redirect to dashboard, admin menu visible |
| T02 | Login | Participant | Login with participant account | No admin-only create/edit actions |
| T03 | Tournament Create | Admin | In `Zarzadzanie Turniejami`, choose Create mode and save | New tournament row appears (no overwrite) |
| T04 | Tournament Edit | Admin | Choose Edit mode, select tournament, save | Existing tournament updated |
| T05 | User Search | Admin | Search participants by name/email in tournament form | Existing users listed only |
| T06 | Add Participant | Admin | Add selected searched user to tournament | User appears in tournament participants |
| T07 | Participant Restriction | Participant | Open participants/results pages | Can view data, cannot edit |
| T08 | Optimization RR | Admin | Optimize non-Swiss tournament | Rounds/matches generated, status `active` |
| T09 | Optimization Swiss | Admin | Optimize Swiss tournament with many players | Feasible rounds generated, no duplicate pairings in one run |
| T10 | Swiss Jam Prevention | Admin | Request too many Swiss rounds (small player set) | Optimizer returns reduced feasible rounds with jam-prevention summary |
| T11 | Start Match Gate | Admin | Try save score before starting match | Save blocked (backend + disabled button) |
| T12 | Match Flow | Admin | Start match, enter score, save | Match becomes `finished`, leaderboard updates |
| T13 | Dashboard Metrics | Any | Open dashboard with active tournament and matches | `Aktywne Turnieje` and `Nadchodzace Mecze` > 0 when applicable |
| T14 | Select Styling | Any | Inspect select elements across pages | Consistent styled selects (`pretty-select`) |
| T15 | Dark Theme Contrast | Any | Switch to dark mode | Light text on dark backgrounds, readable tables/forms |
| T16 | Production Serve | Any | Run `npm run build` then `npm run start` | `/` serves app and `/api/health` returns ok |

## Suggested data for Swiss checks

- Use at least 12-18 participants.
- For jam-prevention scenario, set Swiss rounds close to or above practical limits.
- Confirm optimizer summary indicates reduction when infeasible.
