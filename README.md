# Solar Tetra

[Janer’s interactive developer portfolio](https://github.com/jcastellanos11/solar-tetra-portfolio), built around a living glass tetrahedron and a warm solar core.

Home presents the complete object. Its four faces navigate to **Projects**, **Professional Experience**, **Education & Certifications**, and **Contact**. Readable HTML content stays beside the scene on desktop and below it on smaller screens.

## Experience

- Drag or select a face, or use conventional HTML navigation. Inertia, damping, hysteresis, and a 250 ms stable-detection window keep content from switching during movement.
- Bounded idle animation keeps the selected face visible. Escape and the Home controls restore the overview.
- English, Spanish, and Turkish; dark and light themes; keyboard navigation, focus indicators, reduced motion, and a static WebGL fallback.
- An early HTML/CSS/SVG loading indicator appears independently of the deferred 3D renderer. Content and navigation remain available while the renderer loads.
- A small CV satellite and an equivalent Contact link download the approved English PDF. Labels identify the document language; approved translations can be added through metadata later.

## Technology

| Area | Tools |
| --- | --- |
| Interface | React 19, TypeScript, CSS, local SVG |
| 3D scene | Three.js, React Three Fiber |
| Development/build | Vite, npm lockfile |
| Verification | Node.js test runner, esbuild TSX fixtures, TypeScript, content and asset validators |

This is a static frontend. It requires no backend, database, external API, or runtime credentials. The portfolio’s Professional Experience technology list describes career experience separately from the tools used to build this repository.

## Local development

Use Node.js **24** (the verified release environment) and npm. The package minimum is Node 20.19; use the same Node major locally and on the build host.

```bash
git clone https://github.com/jcastellanos11/solar-tetra-portfolio.git
cd solar-tetra-portfolio
npm ci
npm run dev
```

Vite normally serves the app at `http://127.0.0.1:5173`. No `.env` file is required. `npm ci` installs the dependency versions recorded in the committed `package-lock.json`.

## Validate and build

```bash
npm test
npm run check:content
npx tsc --noEmit
npm run build
npm run preview
```

The build runs content validation, TypeScript, Vite, and a postbuild check that approved CV assets exist in `dist/` and match the source bytes. Preview normally serves `dist/` at `http://127.0.0.1:4173`; it is for local inspection, not a production server.

The current suite has 100 tests, including mounted R3F scene tests with a stub renderer. These cover quaternion copying, navigation commits, settling, cancellation, loading/failure paths, translations, academic records, CV approval/fallback, and accessory isolation. Stub-renderer tests do not compile GPU shaders. See [browser QA](docs/BROWSER_QA.md) for observed browser checks and remaining physical-device, screen-reader, and GPU work.

## Architecture

```text
src/
  components/    HTML layout/content, deferred scene, labels, fallback, CV controls
  interaction/   Imperative rotation/controller, face scoring, picking, independent orbit
  data/          Typed content, academic records, technology metadata, CV approval
  loading/       Dependency-free early loading markup and renderer readiness helpers
scripts/         Content, TypeScript-loader, and production asset validation
tests/          Node tests and mounted React/R3F regression fixtures
public/          Favicon and explicitly approved downloadable CV
```

Frame-by-frame calculations and quaternion updates stay outside React state. `TetraController` is the shared navigation controller; React receives committed section changes. The renderer copies orientations into existing Three.js instances. `SceneExperience` loads the renderer separately, reports readiness after a successful render, and switches to the static fallback on failure.

Content/category/accessibility copy is translated centrally. Technology product names and CV metadata are shared across languages. Keep [academic source records](docs/ACADEMIC_RECORDS_FROM_CV.md) and [approved professional copy](docs/SOLAR_TETRA_CONTENT_REWRITE.md): tests use them to prevent factual drift.

## CV and public assets

The owner-approved English CV is `public/cv/john-castellanos-cv-en.pdf`. Its contents are preserved. `src/data/cv.ts` selects an approved version matching the app language, otherwise approved English; only English is currently enabled.

Future Spanish/Turkish PDFs require explicit approval, the corresponding `john-castellanos-cv-es.pdf` / `john-castellanos-cv-tr.pdf` asset, and a metadata update. Validation rejects unapproved public CV PDFs, missing approved files, and unsafe or mislabeled filenames. Do not add historical/private CVs or secrets to `public/`: everything there is copied to the deployment output. Browser-visible `VITE_*` values must never contain secrets.

## Cloudflare Pages

After GitHub publication is approved, configure a **Pages** project with these settings:

| Setting | Value |
| --- | --- |
| Repository | `jcastellanos11/solar-tetra-portfolio` |
| Framework preset | React (Vite) |
| Root directory | Repository root |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node environment variable | `NODE_VERSION=24` |
| Secrets / runtime bindings | None required |

These settings follow Cloudflare’s [React deployment guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/) and [build-image configuration](https://developers.cloudflare.com/pages/configuration/build-image/). Keep development dependencies available for the build; TypeScript, Vite, and validation need them. Deploy the output directory only, not the repository root. No Wrangler dependency, adapter, Worker, or Pages Function is needed for this static app.

Vite uses `base: '/'`, appropriate for a root-domain Pages deployment. Sections are in-app state, not separate URL routes. Cloudflare Pages supplies default SPA handling; no custom rewrite is needed for the current navigation model. Verify the root page, generated chunks, fallback, and `/cv/john-castellanos-cv-en.pdf` on the deployed host. The existing large deferred renderer warning remains; real mobile startup, compression, and caching must be checked on that host.

## Publication notes

See [pre-publication audit](docs/PUBLICATION_AUDIT.md). Local credentials, environment files, caches, generated output, macOS metadata, and unused internal authoring notes are excluded by `.gitignore`. No license has been selected; public visibility does not itself grant reuse rights, especially for personal CV/content assets.

This preparation does not initialize Git, commit, push, connect Cloudflare, or deploy the site.
