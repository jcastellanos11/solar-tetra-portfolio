// Shared by Vite's HTML transform and the React renderer placeholder. No runtime dependencies.
export const loadingCopy = {
  en: { application: 'Initializing experience', renderer: 'Preparing the solar tetrahedron', help: 'You can explore the portfolio while the 3D scene loads.' },
  es: { application: 'Iniciando la experiencia', renderer: 'Preparando el tetraedro solar', help: 'Puedes explorar el portafolio mientras carga la escena 3D.' },
  tr: { application: 'Deneyim başlatılıyor', renderer: 'Güneş tetrahedronu hazırlanıyor', help: '3B sahne yüklenirken portfolyoyu keşfedebilirsiniz.' },
} as const;

export const loadingIcon = '<svg viewBox="0 0 120 120" fill="none" aria-hidden="true"><path d="M60 12 12 96h96L60 12Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M60 12v54M12 96l48-30 48 30" stroke="currentColor" stroke-width=".8" opacity=".4"/><circle class="solar-loading-halo" cx="60" cy="66" r="17" fill="#eeb16a" opacity=".1"/><circle class="solar-loading-core" cx="60" cy="66" r="5" fill="#eeb16a"/></svg>';

// Inline critical CSS makes the first paint independent of the application bundle.
export const loadingStyles = `
html{background:#080b10;color:#f5f4f0}html[data-theme=light]{background:#f3f2ed;color:#151f27}
body{margin:0}.solar-loading{color:#d6b98c;font-family:ui-sans-serif,system-ui,sans-serif;text-align:center;pointer-events:none}
html[data-theme=light] .solar-loading{color:#795625}
.solar-loading svg{display:block;width:112px;height:112px;margin:0 auto 22px}
.solar-loading strong{display:block;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase}
.solar-loading p{font-size:12px;line-height:1.7;letter-spacing:.04em;margin:12px auto 0;color:#a4acb1;max-width:32ch}
html[data-theme=light] .solar-loading p{color:#515b63}
.solar-loading small{display:block;font-size:11px;line-height:1.7;margin:10px auto 0;max-width:30ch}
.solar-loading--initial{min-height:100vh;min-height:100svh;display:grid;place-content:center;padding:24px;box-sizing:border-box}
.solar-loading--scene{position:absolute;inset:20% 12%;display:grid;align-content:center;z-index:2;background:var(--bg,#080b10);animation:solar-loading-reveal .18s ease-out}
.solar-loading-core,.solar-loading-halo{transform-origin:60px 66px;animation:solar-loading-pulse 2.4s ease-in-out infinite}
.solar-loading-halo{animation-direction:reverse}
@keyframes solar-loading-pulse{0%,100%{opacity:.55;transform:scale(.88)}50%{opacity:1;transform:scale(1.08)}}
@keyframes solar-loading-reveal{from{opacity:0}to{opacity:1}}
@media(prefers-reduced-motion:reduce){.solar-loading--scene,.solar-loading-core,.solar-loading-halo{animation:none}}
`;

export function initialLoadingHtml() {
  return `<div class="solar-loading solar-loading--initial" role="status" aria-live="polite"><div>${loadingIcon}<strong>Solar Tetra</strong><p id="solar-loading-message">${loadingCopy.en.application}</p></div></div>
    <script>(function(){var lang='en';try{var saved=localStorage.getItem('solar-language');if(['en','es','tr'].indexOf(saved)!==-1)lang=saved;document.documentElement.dataset.theme=localStorage.getItem('solar-theme')==='light'?'light':'dark'}catch(e){}document.documentElement.lang=lang;document.getElementById('solar-loading-message').textContent=${JSON.stringify(loadingCopy)}[lang].application})()</script>
    <noscript><style>.solar-loading--initial{display:none}</style><p style="text-align:center">JavaScript is required for this interactive portfolio. Contact: <a href="mailto:jhonjaner11@gmail.com">jhonjaner11@gmail.com</a></p></noscript>`;
}

export function injectInitialLoading(html: string) {
  // Styles belong in head: React replaces the root's initial children on mount.
  return html.replace('<!--solar-loading-styles-->', `<style id="solar-loading-styles">${loadingStyles}</style>`)
    .replace('<!--solar-initial-loading-->', initialLoadingHtml());
}
