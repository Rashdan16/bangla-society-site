# SETUP — getting the site and the committee editor live

Follow this top to bottom once. Afterwards, day-to-day editing is all in
`/admin/` and needs none of this. Budget about 30 minutes.

What you'll end up with:

- the public site on Netlify, rebuilt automatically on every merge to `main`
- the editor at `https://<your-site>/admin/`, log-in by invite only
- every edit becoming a GitHub pull request that an approver merges

> **Heads-up on Git Gateway.** Netlify has marked Git Gateway as *deprecated*:
> it still works and can still be switched on, but Netlify no longer develops
> it. Netlify Identity itself is staying. If Git Gateway is ever turned off, see
> [If Git Gateway goes away](#if-git-gateway-goes-away) — it's a three-line swap.

---

## 0. Before you start

- A GitHub account for you, plus one each for the **President** and **Secretary**
  (approvers) and the **Treasurer** (code owner for charity/links). Members who
  only *edit* do **not** need GitHub accounts.
- A Netlify account (free tier is fine). Sign up with GitHub to skip a step.
- Node.js installed locally if you want to preview the site (`node -v`).

## 1. Put the site on GitHub

```bash
cd bangla-society-site
git status              # should say "nothing to commit" — the history is already here
```

On GitHub: **New repository** → name it `bangla-society-site` → **Private** →
*don't* add a README/.gitignore → **Create**. Then:

```bash
git remote add origin https://github.com/<OWNER>/bangla-society-site.git
git push -u origin main
```

## 2. Connect the repo to Netlify

1. **app.netlify.com → Add new site → Import an existing project → GitHub.**
   Authorise Netlify, pick `bangla-society-site`.
2. Build settings are read from `netlify.toml`, so leave the form as it is
   (publish directory `.`, build command `node scripts/index-content.js`).
   Click **Deploy site**.
3. When the deploy finishes, note the URL (e.g. `https://sparkly-tiger-1234.netlify.app`).
   Rename it if you like: **Site configuration → Site details → Change site name.**
4. Put that URL into `admin/config.yml` (`site_url` and `display_url`, replacing
   `CHANGE-ME`), commit and push. This is what the editor's "View site" link uses.

The public site now works. `/admin/` will load but you can't log in yet.

## 3. Turn on Netlify Identity (invite-only)

1. In the site's dashboard: **Site configuration → Identity → Enable Identity.**
2. **Identity → Registration** → choose **Invite only** → Save.
   *(This is the real gate: no one can create an account themselves.)*
3. **Identity → Registration → External providers:** leave off. Email + password
   is simplest for handover.
4. Optional, recommended: **Identity → Emails → Invitation template** — the
   default email is fine; leave the path as `/` (the homepage forwards invite
   links to the dashboard automatically).

## 4. Turn on Git Gateway

1. **Site configuration → Identity → Services → Git Gateway → Enable Git Gateway.**
2. Netlify may ask you to authorise GitHub again; the branch to use is `main`
   (leave the "Roles" box empty — any logged-in user may use the editor, and the
   PR approval step is what controls publishing).

## 5. Invite the first committee members

1. **Identity → Invite users** → enter the emails (one at a time or several).
2. Each person gets an email → the link opens `dashboard.html` on your site →
   they set a password → they land on the committee dashboard → **Open the editor**.
3. Test it yourself first: invite your own email, accept, open `/admin/`, edit an
   event, click **Save** → you should see it under **Workflow** as a *Draft*,
   and a `cms/events/…` branch + PR appear on GitHub.

## 6. Protect `main` so only approvers publish

On GitHub: **repo → Settings → Branches → Add branch ruleset** (or *Add rule*):

- Branch name pattern: `main`
- ☑ **Require a pull request before merging**
  - Required approvals: **1**
  - ☑ **Require review from Code Owners**
- ☑ **Do not allow bypassing the above settings** (so even admins go through review)
- Save.

Then:

1. **Settings → Collaborators → Add people:** the President, Secretary and
   Treasurer with the **Write** role. (Editors who never approve don't need this.)
2. Edit `.github/CODEOWNERS` and replace the two placeholder handles with the
   President's and Treasurer's GitHub usernames. Commit and push.

From now on, "Publish" in the editor only works after a PR has an approval;
approvers can also just press **Merge** on GitHub.

## 7. Day-to-day: how a change goes live

```
member edits in /admin/  →  Save (Draft)  →  In review (PR opens)
      →  approver approves on GitHub  →  Publish / Merge  →  Netlify rebuilds (~1 min)
```

Full role table and the handover checklist: [`admin/ROLES.md`](admin/ROLES.md).

---

## Running it locally

```bash
node scripts/index-content.js     # rebuild content/*.json after editing files by hand
python -m http.server 8001        # or any static server
# open http://localhost:8001
```

Opening `index.html` straight from the file system no longer works — the page
fetches `content/*.json`, which browsers block on `file://`. Use a local server.

**Editing locally without logging in:** run `npx decap-server` in a second
terminal, then open `http://localhost:8001/admin/`. Decap notices the proxy on
localhost and writes straight to your files (no PRs). This is only ever active
on localhost.

## If Git Gateway goes away

[DecapBridge](https://decapbridge.com) is a free hosted replacement that speaks
the same protocol. Sign up, add the site, and it gives you a site id. Then:

1. In `admin/config.yml`, replace the `backend:` block with

   ```yaml
   backend:
     name: git-gateway
     repo: <OWNER>/bangla-society-site
     branch: main
     identity_url: https://auth.decapbridge.com/sites/<SITE-ID>
     gateway_url: https://gateway.decapbridge.com
   ```

2. In `admin/index.html` and `dashboard.html`, remove the
   `netlify-identity-widget.js` script tag (DecapBridge shows its own login).
3. Invite members from the DecapBridge dashboard instead of Netlify Identity.

Nothing about `content/`, the site, branch protection or CODEOWNERS changes.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `/admin/` shows "Error loading the CMS configuration" | Syntax error in `admin/config.yml`. The message names the line. |
| Login button does nothing / "Failed to load settings" | Identity isn't enabled on *this* site (step 3), or you're on a deploy-preview URL — use the main site URL. |
| "Git Gateway Error: Please ask your site administrator to reissue the Git Gateway token" | Netlify → Identity → Services → Git Gateway → *Edit settings* → regenerate token. |
| "Publish" fails with a merge error | Branch protection is doing its job — the PR needs an approval on GitHub first. |
| New event saved but not on the site | It's still a draft/PR. Check the **Workflow** tab, or the PR on GitHub. Also check the event's "Published" toggle. |
| Site shows old content after a merge | Netlify build failed or is still running: **Deploys** tab. The build only runs `node scripts/index-content.js`. |
| Invite link opens the homepage and nothing happens | The redirect script at the bottom of `index.html` sends `#invite_token` to the dashboard; make sure that script is still there. |

## Later (needs a backend — not built yet)

- **RSVP / headcount** — a Netlify Form (or Function + store) per event; slot a
  form under each `.ev-card` in `renderEvents()` and a count on the dashboard.
- **Membership enquiry form** — Netlify Forms with an email notification;
  add a `<form netlify>` to the Socials section.
- **Academic-year archive** — add a `year` field to Events in `config.yml`,
  a `view_groups` entry to group by it, and filter in `renderEvents()`.
