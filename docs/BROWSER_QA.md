# Solar Tetra browser verification

## Mobile orbit and ambient refinements — November 20, 2026

Native desktop Firefox against the existing `http://127.0.0.1:5173/` Vite development server. The host-managed browser connector was unavailable, so native browser UI and Firefox Responsive Design Mode were used. These are desktop viewport observations, not physical iOS/Android verification or a production deployment check.

| Width | Observed combination |
| --- | --- |
| 320px | English, dark, Projects |
| 375px | English, dark, Projects |
| 390px | Spanish, light, Projects |
| 430px | Turkish, light, Projects |
| 768px | Turkish, light, Projects; keyboard satellite focus |
| 1200px | Turkish light and English dark; desktop tooltip, Home/manual rotation/Contact |

- Live energetic glass and solar core rendered throughout. The compact satellite changed position across observations instead of docking, retained its document icon/EN badge, and stayed inside the scene with clearance from Home and the face-key controls in the inspected layouts. The active Projects label moved clear of the satellite when needed. The active face remained recognizable during the visibly stronger bounded idle movement; no unintended section change was observed while idle. This is a visual spot check, not a continuous full-orbit collision capture of every language/layout.
- Compact screenshots contained no floating CV description. At 768px keyboard Tab focused the satellite with a visible outline and full Turkish accessible name, while the tooltip remained hidden. At 1200px the same focus interaction displayed “CV indir / İngilizce · PDF”. Automated CSS contracts additionally cover the hover/focus/touch override at <=860px. The first narrow checks used Firefox touch emulation; it was disabled for subsequent deterministic mouse/keyboard interactions. No physical tap was tested.
- Dragging from the focused desktop satellite did not download or change Projects. A subsequent separate click completed a real 226KB download and opened Firefox's PDF viewer. `john-castellanos-cv-en-3.pdf` (browser duplicate filename) matched the public source SHA-256 `97fda3dbb747e4a31a9d01a20aa05ea43da82040b948ba17b9687a4b5a80bfb8`. The approved PDF and CV metadata were not modified.
- Home navigation still returned the angled whole-object overview. A manual drag of the actual tetrahedron kept Home during movement, then settled and committed Contact. Returning Home worked afterward. No blocking loader appeared during these selections.
- Restored the original responsive width 760 and enabled touch-emulation setting, closed responsive mode, and left the new local test tab in Spanish/dark/Home. The new PDF download copy remains in Downloads.

Automated result: **104 tests pass**, including mounted R3F orbit movement at compact widths, measured boundaries and immediate pointer pause; actual accessory handlers/download isolation; reduced-motion pause; all-face >0.98 dominance/no idle commits over 90-second simulations; smooth manual takeover/resumption; and unchanged readiness/fallback/quaternion coverage. Content validation, TypeScript, production build, and approved CV source/output equality pass. CSS contract tests are not a substitute for a layout engine.

Remaining: physical iOS/Android tap acquisition while orbiting, download/scroll/drag isolation and touch hover behavior; Chrome/Safari repeat checks; browser reduced-motion preference before/during interaction; screen-reader names; prolonged complete orbits with every face, language, theme, and viewport combination; rapid resizing/orientation changes and genuinely cramped-height fallback; low-power GPU/frame pacing. No physical-device, screen-reader, FPS, or GPU profiling was performed for this update. Previously documented failure-mode follow-ups below remain outstanding.

## Approved English CV activation — November 20, 2026

Native Firefox tested the existing local Vite development server. Chrome's native window was unavailable (`cgWindowNotFound`), and the browser connector host was unavailable. Starting a new production preview server failed with `listen EPERM`; production files were validated on disk, not served through a newly started preview.

- The small amber-glass sphere and illuminated document SVG rendered beside the live glass tetrahedron. Its screen position advanced through the existing orbit; selecting Contact retained the same satellite infrastructure. Focus held the sphere at the same position across separated screenshots while the tetrahedron continued its idle movement.
- Clicking the satellite downloaded `john-castellanos-cv-en.pdf`; Firefox reported a completed 226 KB download and automatically opened its local PDF viewer. Returning to the portfolio still showed Home, with no unintended section commit.
- Clicking the translated Contact download also completed successfully (`john-castellanos-cv-en-1.pdf`, Firefox's duplicate-file name). The source PDF, `dist/cv/` copy, and **both actual browser downloads** have identical SHA-256 `97fda3dbb747e4a31a9d01a20aa05ea43da82040b948ba17b9687a4b5a80bfb8`. The source is 231,650 bytes and was not modified.
- EN/ES/TR accessible satellite labels identified the English PDF correctly: Download CV / English, Descargar CV / Inglés, CV indir / İngilizce. Spanish and Turkish Contact links also pointed to the same approved English URL. No Spanish/Turkish PDF was created or requested.
- Responsive 320 × 844 layout showed a docked satellite with the EN badge and readable inward-aligned label. Spanish dark and Turkish light were inspected; keyboard Tab reached the Turkish satellite with a visible focus outline and “CV indir / İngilizce · PDF” label. At desktop width the orbit resumed after focus moved away.
- Dragging from the focused docked satellite did not produce another download or change Home. Existing Home/Contact selection and the live tetrahedron remained operational. Automated handler/mounted-scene tests additionally retain pointer pause/cancellation, motion guard, reduced motion, and tetrahedron interaction coverage.
- Firefox touch emulation caused the preview to zoom during input; it was disabled for subsequent mouse/keyboard checks and zoom was reset. This does **not** certify a physical tap/drag or rule out device-specific behavior. The original responsive width (760), touch-emulation setting, dark theme, Turkish language, and Home state were restored; responsive mode was closed. Test download copies were retained in Downloads.

Production build/postbuild checks confirm the real PDF exists at `/cv/john-castellanos-cv-en.pdf` in the output and matches the source byte for byte. Tests simulate future approved ES/TR metadata and reject missing, invalid, unsafe, or unapproved public assets without publishing fixtures.

Remaining: physical iOS/Android tap/download/scroll isolation; separately observed hover-only pause, browser reduced-motion preference, and CV download after deliberately disabling WebGL; screen-reader testing; Chrome/Safari repeat checks; and deployed-host Content-Type/download/caching behavior. Contact uses a native HTML anchor outside the WebGL subtree; its independence and language selection are covered in automated rendering tests, but this update did not deliberately disable WebGL in Firefox.

## Loading, GLUD, and Technology Stack — November 20, 2026

Observed using native desktop Chrome against the existing local Vite **development server**, including a 320 × 864 responsive viewport. These are desktop emulation observations, not physical-device or production-host performance certification.

- Disabled browser cache and selected Slow 4G in DevTools. The HTML/SVG Solar Tetra indicator appeared while `main.tsx` and other application scripts were still pending. The interface subsequently appeared and the live energetic-glass tetrahedron rendered; the regional loading status disappeared. A Spanish cold reload also showed “Iniciando la experiencia”.
- Earlier fresh-load observation captured the Spanish regional “Preparando el tetraedro solar” status alongside usable Home content/navigation, followed by live rendering. No minimum loading duration or percentage display is used.
- The throttled development run showed 49 requests, approximately 4.3 MB transferred, DOMContentLoaded 12.92s, and Network Finish 26.91s. The development Three dependency chunk alone took 11.61s to transfer. This demonstrates network contribution in that run, **not** production startup time or GPU compilation time. No comparable before/after device timing was collected.
- At 320px, English stack categories/chips wrapped within the panel. Turkish light-theme quality/AI categories and long chips were readable without observed horizontal overflow. Spanish translated categories/practices were present in Chrome's accessibility tree. English desktop layout used multiple compact columns alongside the sticky live tetrahedron. This was not a full language × theme × viewport matrix.
- Education showed the existing GNU/Linux record, the full official GLUD name, 2017, and the translated Spanish external link. Tab focused the link with a visible outline; its accessible name includes the group name and new-tab announcement. The live external website itself was not opened/tested.
- DevTools blocked only `src/components/TetraScene.tsx`. The app displayed the static tetrahedron, removed the loading status, and Contact navigation still committed normally. The blocked request and error indicators remained visible: errors were not suppressed. This verifies renderer **download failure**, not a separately induced GPU/context failure.
- Removed the test blocking rule, disabled blocking, restored No throttling and normal cache settings, and exited device emulation/DevTools. A fresh reload returned live glass/core rendering. Dragging from Home visibly rotated the object while Home content remained, then settled and committed Contact. Experience navigation and Escape back to Home also worked without a blocking loader.
- Finished in English/dark/Home. No CV download or satellite was enabled.

Automated coverage now additionally exercises early HTML injection/translations/theme restoration, pre-JavaScript reduced-motion CSS, mounted Suspense/readiness transitions, first-successful-frame signaling, shader/render/module failures, visible startup timeout and hidden-tab suspension, no loading restart on section changes, GLUD link semantics, translated stack scopes/categories, and a responsive CSS contract. It does not substitute for a real layout engine, GPU, or screen reader.

Remaining for this update: cold **production-host** loads with actual compression/cache headers; iOS/Android startup timings and visual comparison at the 1.25 DPR cap; first-frame shader/GPU profiling; independently disabled WebGL and deliberate runtime context loss; reduced-motion browser preference before/during startup; a complete language/theme/viewport matrix and screen-reader announcements. The owner reported successful physical-mobile use of the preceding implementation; no new physical-device test was performed here.

## Observed in native desktop Chrome

- The original glass tetrahedron and animated warm solar core render after a fresh reload.
- Home shows the whole object at an angle, with no active face marker. The face key contains only Projects, Professional Experience, Education & Certifications, and Contact.
- The central Home control returns from Contact to the Home overview. Dragging from the Home button instead of clicking did not navigate.
- Escape returned from Professional Experience to Home.
- Selecting Education aligned the blue face and committed matching HTML content. Academic names, providers, and dates were visible; EN/ES/TR switching translated classifications and descriptions while preserving official names.
- Professional Experience displayed November 2025–Present, September 2018–October 2025, and July 2017–September 2018, with PHP removed from Infometrika's main summary.
- Dragging the actual glass from Home rotated the object while Home content remained visible. After inertia/settling, Contact aligned and its panel appeared.
- English was restored. No satellite, CV download link, or public PDF was activated.

Native browser UI was available even though the browser connector was unavailable. These observations do not certify all browsers, physical touch, or assistive technologies.

## Automated scope

The tests mount the actual scene with the installed R3F reconciler and a stub renderer. They cover all five destinations, four scored/pickable faces, Home interruption, preserved quaternion instances, movement, idle dominance, hysteresis, captured touch-style pointer events, native accessory handlers, satellite pause/reduced-motion behavior, academic facts/categories, all translated panels, exact contact links, CV gates, and error/fallback paths.

Shader source for glass and the solar core was checked unchanged. Stub-renderer tests do not compile shaders on a GPU. Positive CV tests use temporary/in-memory fixtures and do not publish a PDF.

## Remaining browser checks

| Area | Required check |
|---|---|
| Firefox and Safari | Repeat all five navigation destinations, face clicks, manual settling, rapid interruptions, Home, Escape, labels, and live shader rendering. |
| Actual iOS/Android touch | Rotate from all five destinations; test pointer capture, cancellation, multi-touch ownership, scrolling outside the visual region, Home tap versus drag, and narrow five-item navigation. |
| Face selection | Exercise all four visible faces and the base/Education face after repeated full rotations; test near-boundary ties and fast direction reversals. |
| Home interruption | Request Home during dragging, inertia, settling, and alignment; release an old pointer afterward and confirm it cannot commit a face. |
| Accessible keyboard | Confirm visible focus, all five destinations, isolated Home action, skip link, and sensible focus after replaced content actions. |
| Screen readers | Confirm one committed-section announcement and correct degree/exchange/research/certificate/preparation distinctions in EN/ES/TR. |
| Content/layout | Review all five sections and expanded experience details in both themes at 320px and large viewports. Ensure sticky visuals, labels, and controls do not obscure text or glass. |
| Reduced motion | Test preference before load and during movement. No idle/inertial motion; Home and explicit face requests commit promptly. |
| Failure modes | Block WebGL initialization and simulate independent runtime context loss/renderer failure; verify visible static fallback and independent HTML navigation. |
| Performance | Check prolonged idle and repeated interactions on low-power hardware; inspect GPU usage and confirm no frame-driven React renders. |
| Approved CV follow-up | Repeat the Firefox observations above on Chrome/Safari and physical touch devices; test hover-only pause, browser reduced motion, WebGL-unavailable Contact download, screen readers, and deployed-host download behavior. Future ES/TR PDFs still require explicit approval. |

The prior runtime issue was caused by passing a source-module Quaternion as a JSX prop to a bundled Three Object3D. R3F's constructor guard fell through to assigning the read-only quaternion property. Continue using `.copy()` on the existing instance. R3F intentionally loses contexts during teardown, so a context-loss message following a mounting exception can be secondary. Independent context loss remains a separate fallback test. A previous attempt to inject context loss via Chrome DevTools was blocked by its paste warning; that protection was not bypassed.
