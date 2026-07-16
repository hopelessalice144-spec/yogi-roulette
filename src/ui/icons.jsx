/** Vector HUD icons — UI-UX Pro Max (no emoji structural icons). */

export function IconVolumeOn({ className = 'icon-svg' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="currentColor"
        d="M11 5L6 9H3v6h3l5 4V5zm2.14 3.86a5 5 0 010 6.28l1.42 1.42a7 7 0 000-9.88l-1.42 1.42zm3.28-3.28a9 9 0 010 12.73l1.42 1.42a11 11 0 000-15.54l-1.42 1.42z"
      />
    </svg>
  );
}

export function IconVolumeOff({ className = 'icon-svg' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="currentColor"
        d="M11 5L6 9H3v6h3l5 4V5zM3.27 3L2 4.27l6.73 6.73H3v6h3l5 4v-4.73l4.73 4.73L22 19.73 3.27 3zm12.73 2.46l-1.42 1.42a5 5 0 010 6.28l1.42 1.42a7 7 0 000-9.88z"
      />
    </svg>
  );
}

export function IconShieldCheck({ className = 'icon-svg' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path
        fill="currentColor"
        d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14l-4-4 1.41-1.41L11 12.17l5.59-5.59L18 8l-7 7z"
      />
    </svg>
  );
}
