# Portfolio Frontend

Static site built with **Bootstrap 5** (plain HTML/CSS/JS, no build step,
no framework, no npm install required). All content — profile info,
education, publications, projects, gallery, blog posts, etc. — is fetched
at page-load time from the backend API, so the site can be updated
entirely through its built-in admin panel without touching this code.

**Live site:** `https://rashelmahmudrabbi.github.io`
**Backend API:** `https://portfolio-backend-u.vercel.app/api` (see `portfolio-backend/README.md`)

---

## Structure

```
portfolio-frontend/
├── index.html                  # homepage (hero, education, publications
│                                  preview, projects, certifications,
│                                  awards, gallery, personal info, references)
├── projects/index.html
├── publications/index.html
├── teaching/index.html
├── blog/index.html
├── cv/index.html
├── assets/
│   ├── css/                      # stylesheets
│   └── js/
│       ├── config.js              # sets API_BASE — the only file you
│       │                           edit when the backend URL changes
│       ├── api.js                  # shared fetch helper (fetchJSON,
│       │                           escapeHtml) used by every page script
│       └── site-*.js               # one render script per page
└── media/                        # static images shipped with the site
                                    (profile photo, award photos,
                                    certificate images, gallery photos)
```

## How pages load data

Each HTML page loads scripts in this order:

```html
<script src="assets/js/config.js"></script>
<script src="assets/js/api.js"></script>
<script src="assets/js/site-home.js"></script>  <!-- varies per page -->
```

`config.js` defines `API_BASE`. `api.js` provides `fetchJSON(path, fallback)`,
which every `site-*.js` file calls to pull JSON from the backend and render
it into the page. If the backend is unreachable, `fetchJSON` fails soft —
it logs a console warning and returns the fallback value instead of
breaking the whole page.

**This load order matters.** `config.js` must load before `api.js`, and
`api.js` before any `site-*.js` file — otherwise you'll see
`ReferenceError: API_BASE is not defined` or
`ReferenceError: fetchJSON is not defined` in the console.

---

## 1. Pointing the frontend at the backend

Edit `assets/js/config.js`:

```js
const API_BASE = 'https://portfolio-backend-u.vercel.app/api';
```

For local testing against a backend running on your own machine
(`npm run dev` in the `portfolio-backend` folder), change this to:

```js
const API_BASE = 'http://localhost:8000/api';
```

> Only ever declare `API_BASE` in `config.js`. Don't redeclare it inside
> `api.js` or any other script — a duplicate `const API_BASE` declaration
> throws a `SyntaxError` that silently breaks every script loaded after it.

---

## 2. Deployment (GitHub Pages)

This frontend is deployed via **GitHub Pages** directly from this repo,
independently of the backend — the backend runs on Vercel (see
`portfolio-backend/README.md`); this folder only needs `API_BASE` pointed
at it.

1. Push changes to the `main` branch.
2. GitHub Pages rebuilds automatically — check the **Actions** tab in the
   repo for a green checkmark confirming the deploy finished.
3. The live site updates at `https://rashelmahmudrabbi.github.io` within
   about a minute.

No build step, no environment variables, and no server config are needed —
it's plain static files served as-is. Everything dynamic comes from the
backend URL set in `config.js`.

### Cache-busting after a deploy

Browsers sometimes serve a cached copy of `.js`/`.css` files even after a
new version is live. If changes don't appear to take effect:
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or open the site in an incognito/private window
- Or check the raw file directly on GitHub (`github.com/.../blob/main/assets/js/api.js`)
  to confirm what's actually deployed before debugging further

---

## 3. Editing content

Go to `https://portfolio-backend-u.vercel.app/admin`, log in with the admin
credentials set on the backend, and edit any section (profile, education,
publications, projects, gallery, blog, etc.). Changes appear on the live
site as soon as you reload the page — no frontend redeploy needed, since
content is fetched fresh from the API on every load.

---

## 4. Adding new images

This frontend has no image-upload feature (kept out to keep the backend
simple). To add a new photo (e.g. a new gallery event or certificate):

1. Drop the image file into `media/...` in this repo (e.g.
   `media/gallery/MyEvent/photo1.jpg`) and push to GitHub — Pages will
   redeploy automatically.
2. In the admin panel, set the item's image field to that relative path,
   e.g. `media/gallery/MyEvent/photo1.jpg`.

Alternatively, paste any external image URL directly into the image field
in admin instead of uploading a local file.

---

## Troubleshooting

- **Console shows `Identifier 'API_BASE' has already been declared`** —
  `api.js` (or another script) is redeclaring `API_BASE`, which is already
  defined in `config.js`. Remove the duplicate declaration.
- **Console shows `fetchJSON is not defined`** — usually a side effect of
  the error above: if `api.js` throws a `SyntaxError`, none of its
  functions get defined, so anything calling `fetchJSON` afterward fails
  too. Fix the root `SyntaxError` first.
- **Page stuck on "Loading..."** — open DevTools → Network tab and check
  the status of the request to the backend. `(failed)` or
  `ERR_CONNECTION_REFUSED` usually means `API_BASE` still points at
  `localhost` instead of the deployed Vercel URL. A `404` means the path
  in `api.js` doesn't match the backend's actual route — compare against
  the API reference table in the backend README.
- **"Tracking Prevention blocked access to storage for ..." in the
  console** — this is just the browser's built-in privacy feature
  complaining about third-party CDN cookies (Bootstrap via jsDelivr). It's
  harmless noise, unrelated to any actual bug.