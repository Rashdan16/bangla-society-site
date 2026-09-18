# Who can do what — committee editing

The site is edited through the committee editor at **`/admin/`**. Pressing
**Publish** puts a change live straight away — there is no approval step. This
page says what is *enforced by software* and what is *just an agreement*.

## The short version

| Role | Who (2026) | Needs a GitHub account | Log in to the editor | Events, photos, banner | Charity / links | Undo mistakes |
|---|---|---|---|---|---|---|
| **Committee member** | everyone on the committee | ❌ | ✅ | ✅ live on Publish | ⚠️ can, but shouldn't | ❌ |
| **Money & links** | Ibrahim (Treasurer), Raidah (President) | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Site maintainer** | Rashdan | ✅ (the one account) | ✅ | ✅ | ✅ | ✅ on GitHub / Netlify |

✅ = allowed · ⚠️ = technically possible, by agreement not done

## What is REAL access control

1. **Logging in.** Netlify Identity is set to *invite only*. Nobody can register
   themselves; the maintainer sends invites from the Netlify dashboard.
2. **Everything is recorded.** Every Publish is a git commit on `main` with the
   editor's name on it. Nothing is ever lost — the maintainer can restore any
   earlier version (see *Undoing a mistake* below).

## What is CONVENTION (not enforced)

- **Anyone logged in can open every screen** — including *Site settings →
  Charity* and *Links*. Open-source Decap has no per-collection permissions, so
  the config only *labels* those screens "Treasurer / President".
- **Nobody reviews a change before it goes live.** The committee is small and
  the content is low-risk (dates, captions, links), so we trade a review step
  for speed. If that ever stops being true, the maintainer can switch
  `publish_mode` in `admin/config.yml` to `editorial_workflow`, which turns
  every save into a GitHub pull request an approver has to merge.

## Undoing a mistake (maintainer)

- **Small fix:** just open `/admin/`, correct it, Publish.
- **Roll the whole site back:** Netlify → *Deploys* → pick the last good deploy
  → **Publish deploy**. Instant, and the editor still works.
- **Restore one file:** on GitHub, open the commit history of the file, or
  locally `git revert <commit>` and push.

## Adding a new committee member (handover checklist)

1. **Netlify → your site → Identity → Invite users.** Enter their email. They get
   a link that opens `/dashboard.html`, where they set a password.
2. Update the table at the top of this file and the contacts on
   `dashboard.html`.
3. **Leaving?** Netlify → Identity → the person → *Delete user*. Their past edits
   stay in git history (fine).

## Handing over the maintainer role

The maintainer is whoever owns the GitHub repo and the Netlify site. To hand
over: on GitHub, *Settings → Collaborators → Add* the new person, then
*Transfer ownership*; on Netlify, *Team → Members → Add* them as Owner. Both are
five-minute jobs.

## Where the settings live

| Setting | Where |
|---|---|
| Invite-only registration | Netlify → Identity → Registration → *Invite only* |
| Git Gateway | Netlify → Identity → Services → Git Gateway |
| Publishing mode (instant vs. reviewed) | `admin/config.yml` → `publish_mode` |
| What the editor can edit | `admin/config.yml` |
