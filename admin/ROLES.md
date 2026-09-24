# Who can do what — committee editing

The site is edited through the committee editor at **`/admin/`**. Pressing
**Publish** puts a change live straight away — there is no approval step. This
page says what is *enforced by software* and what is *just an agreement*.

## The short version

| Role | Who (2026) | Needs a GitHub account | Log in to the editor | Events, photos, banner | Charity / links | Undo mistakes |
|---|---|---|---|---|---|---|
| **Committee member** | everyone on the committee | ❌ | ✅ | ✅ live on Publish | ⚠️ can, but shouldn't | ❌ |
| **Money & links** | Ibrahim (Treasurer), Raidah (President) | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Site maintainer** | Rashdan | ✅ (the one account) | ✅ | ✅ | ✅ | ✅ on GitHub / Vercel |

✅ = allowed · ⚠️ = technically possible, by agreement not done

## What is REAL access control

1. **Logging in.** One shared committee password. Anyone who knows it can
   publish, so share it only with the committee. To lock someone out, the
   maintainer changes it (see *Changing the password* below).
2. **Everything is recorded.** Every Publish is a git commit on `main` with the
   name typed at login on it. Nothing is ever lost — the maintainer can restore any
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
- **Roll the whole site back:** Vercel → *Deployments* → the last good one →
  ⋯ → **Instant Rollback**. The editor keeps working.
- **Restore one file:** on GitHub, open the commit history of the file, or
  locally `git revert <commit>` and push.

## Adding a new committee member (handover checklist)

1. Tell them the committee password and send them the link to
   `/dashboard.html`. That's it.
2. Update the table at the top of this file and the contacts on
   `dashboard.html`.
3. **Someone leaving, or the password got out?** Change the password (below)
   and tell the remaining committee. Past edits stay in git history (fine).

## Changing the password (maintainer)

**Vercel → the project → Settings → Environment Variables → `CMS_PASSWORD` →
Edit**, save, then **Deployments → latest → ⋯ → Redeploy**. Everyone is logged
out and needs the new password. Pick something long (a short phrase is good):
anyone with it can change the site.

## Handing over the maintainer role

The maintainer is whoever owns the GitHub repo and the Vercel project. To
hand over: on GitHub, *Settings → Collaborators → Add* the new person, then
*Transfer ownership*; on Vercel, *Settings → Members* (or transfer the
project). Then they generate their own GitHub token and replace
`GITHUB_TOKEN` in Vercel (SETUP.md step 3). Each is a five-minute job.

## Where the settings live

| Setting | Where |
|---|---|
| The committee password | Vercel → the project → Settings → Environment Variables → `CMS_PASSWORD` |
| The GitHub token the editor commits with | same place → `GITHUB_TOKEN` (regenerate on GitHub when it expires) |
| Hosting, domain, rollbacks | Vercel → the project |
| Publishing mode (instant vs. reviewed) | `admin/config.yml` → `publish_mode` |
| What the editor can edit | `admin/config.yml` |
