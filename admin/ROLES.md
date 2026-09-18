# Who can do what — committee editing roles

This site is edited through the committee editor at **`/admin/`**. Every change a
member makes becomes a pull request (PR) on GitHub and only goes live once an
approver merges it. This page says exactly what is *enforced by software* and
what is *just an agreement between us*.

## The short version

| Role | Who (2026) | Log in to the editor | Edit events & photos | Edit charity / links | Edit the banner | Approve & publish |
|---|---|---|---|---|---|---|
| **Committee member** | Anah, Hamim, Rashdan, Shanjeda, Ibrahim… | ✅ | ✅ (goes to review) | ⚠️ can, but shouldn't | ✅ (goes to review) | ❌ |
| **Approver** | Raidah (President), Shabab (Secretary) | ✅ | ✅ | ⚠️ President only | ✅ | ✅ merges PRs on GitHub |
| **Money & links** | Ibrahim (Treasurer), Raidah (President) | ✅ | ✅ | ✅ | ✅ | Treasurer: review only |

✅ = allowed and enforced · ⚠️ = technically possible, blocked at approval

## What is REAL access control

1. **Logging in.** Netlify Identity is set to *invite only*. Nobody can register
   themselves; an approver has to send an invite from the Netlify dashboard.
2. **Nothing goes live without a merge.** Decap runs in *editorial workflow*
   mode. Saving in the editor creates a branch and a PR (`cms/events/…`).
   The public site only reads `main`.
3. **Only approvers can merge.** GitHub *branch protection* on `main` requires
   one approving review before a merge, and the editor's "Publish" button
   simply fails until that review exists. Who can review = whoever has *write*
   access on the GitHub repo = the approvers. This is set in GitHub, **not** in
   `admin/config.yml`.
4. **Charity + links need a specific reviewer.** `.github/CODEOWNERS` lists the
   President and Treasurer as owners of `content/settings/charity.json` and
   `content/settings/links.json`. With "Require review from Code Owners"
   switched on, a PR touching those files cannot be merged until one of *them*
   approves it — even an approver can't merge it alone.

## What is CONVENTION (not enforced)

- **Anyone logged in can open every screen** — including *Site settings →
  Charity* and *Links*. Open-source Decap has no per-collection permissions,
  so the config only *labels* those screens "Treasurer / President".
  A member who edits them anyway just creates a PR that a code owner has to
  approve (point 4 above), so no harm is done.
- **Netlify Identity roles** (e.g. giving someone the role `approver` in the
  Netlify UI) are informational for this site. They do not change what Decap
  lets a person do. We still set them, so a future upgrade (or a Netlify
  function) can use them.

### Why not lock the charity screen properly?

The brief offered three options. Recommendation: **option 1 + CODEOWNERS** (what's
implemented). It gives real enforcement of *who signs off* on money and link
changes with zero custom code. Option 2 (a Netlify function checking Identity
roles) can't actually intercept Git Gateway commits — it would need a custom
backend, which is a lot of work for a seven-person committee. Option 3 (a separate
private repo) splits the site in two and makes handover harder.

## Publishing, step by step

1. A member edits something in `/admin/` and clicks **Save**. Status: *Draft*.
2. They move it to **In review** (Workflow tab, or the status dropdown). GitHub
   now has an open PR, and approvers get an email if they've turned on
   notifications for the repo.
3. An approver opens the PR on GitHub, reads the diff (it's just the content
   file), and clicks **Approve**.
4. Anyone can now press **Publish** in the editor, or the approver presses
   **Merge** on GitHub. Netlify rebuilds and the change is live in ~1 minute.

## Adding a new committee member (handover checklist)

1. **Netlify → your site → Identity → Invite users.** Enter their email. They get
   a link that opens `/dashboard.html`, where they set a password.
2. If they should also *approve*: **GitHub → repo → Settings → Collaborators →
   Add people** with the *Write* role. For the President/Treasurer, also update
   the GitHub usernames in `.github/CODEOWNERS`.
3. Update the table at the top of this file and the contacts on
   `dashboard.html`.
4. **Leaving?** Netlify → Identity → the person → *Delete user*, and remove them
   from GitHub collaborators. Their past edits stay in git history (fine).

## Where the settings live

| Setting | Where |
|---|---|
| Invite-only registration | Netlify → Identity → Registration → *Invite only* |
| Git Gateway | Netlify → Identity → Services → Git Gateway |
| Branch protection / required review | GitHub → Settings → Branches → `main` |
| Code owners | `.github/CODEOWNERS` in this repo |
| What the editor can edit | `admin/config.yml` |
