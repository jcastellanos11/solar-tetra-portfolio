/** Accessible, dependency-free visual fallback when WebGL is unavailable. */
export function StaticTetra({ label }: { label: string }) {
  return (
    <svg className="static-tetra" viewBox="0 0 520 540" role="img" aria-label={label}>
      <defs>
        <radialGradient id="solar-glow"><stop offset="0%" stopColor="#ffc475" stopOpacity=".75" /><stop offset="30%" stopColor="#ff9e4b" stopOpacity=".36" /><stop offset="100%" stopColor="#ff9e4b" stopOpacity="0" /></radialGradient>
        <linearGradient id="glass-l" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6a9b9d" stopOpacity=".20" /><stop offset="100%" stopColor="#1a4a54" stopOpacity=".08" /></linearGradient>
        <linearGradient id="glass-r" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c8edf0" stopOpacity=".24" /><stop offset="100%" stopColor="#284c58" stopOpacity=".08" /></linearGradient>
      </defs>
      <circle cx="263" cy="264" r="166" fill="url(#solar-glow)" />
      <path d="M260 80 76 415 262 320Z" fill="url(#glass-l)" stroke="#9ad4c1" strokeOpacity=".20" />
      <path d="M260 80 450 414 262 320Z" fill="url(#glass-r)" stroke="#b4f1ec" strokeOpacity=".19" />
      <path d="M76 415 262 320 450 414Z" fill="#73a6a2" fillOpacity=".12" />
      <circle cx="262" cy="303" r="23" fill="#ffb258" />
      <circle cx="262" cy="303" r="71" fill="url(#solar-glow)" />
    </svg>
  );
}
