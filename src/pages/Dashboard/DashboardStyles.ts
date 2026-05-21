export const DASHBOARD_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dashboardAccentColor": "#725735",
  "dashboardAccentHover": "#5C452B",
  "dashboardSurfaceTint": "#EFE6D4",
  "dashboardCardRadius": "1.35rem"
}/*EDITMODE-END*/

export const DASHBOARD_STYLES = `
  .dashboard-shell {
    --dashboard-accent: var(--ocd-tweak-dashboard-accent-color, var(--color-accent));
    --dashboard-accent-hover: var(--ocd-tweak-dashboard-accent-hover, var(--color-accent-hover));
    --dashboard-surface-tint: var(--ocd-tweak-dashboard-surface-tint, var(--color-accent-subtle));
    --dashboard-card-radius: var(--ocd-tweak-dashboard-card-radius, 1.35rem);
    background:
      radial-gradient(circle at top left, color-mix(in srgb, var(--dashboard-surface-tint) 55%, transparent) 0, transparent 34rem),
      linear-gradient(180deg, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 82%, var(--color-surface)) 100%);
  }

  .dashboard-panel {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: calc(var(--dashboard-card-radius) + 0.55rem);
    background: color-mix(in srgb, var(--color-bg-card) 90%, transparent);
    box-shadow: 0 22px 70px rgba(43, 43, 43, 0.08);
  }

  .dashboard-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(var(--color-border) 1px, transparent 1px),
      linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
    background-size: 44px 44px;
    opacity: 0.16;
    mask-image: linear-gradient(180deg, black, transparent 78%);
  }

  .dashboard-actions-bar {
    position: relative;
    display: grid;
    grid-template-columns: minmax(16rem, 1fr) minmax(12rem, 22rem);
    gap: 1rem;
    align-items: center;
    margin: 1.75rem 0 2rem;
    padding: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: var(--dashboard-card-radius);
    background: color-mix(in srgb, var(--color-bg-card) 86%, var(--dashboard-surface-tint));
  }

  .dashboard-actions-hint {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 0.82rem;
    line-height: 1.45;
  }

  .dashboard-actions-hint strong {
    color: var(--dashboard-accent);
    font-weight: 760;
  }

  .flip-card {
    perspective: 1200px;
  }
  .flip-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
    transform-style: preserve-3d;
  }
  .flip-card:hover .flip-card-inner,
  .flip-card:focus-within .flip-card-inner {
    transform: rotateY(180deg);
  }
  .flip-card-front, .flip-card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .flip-card-back {
    transform: rotateY(180deg);
    overflow: hidden;
  }

  .project-card-surface {
    border-radius: var(--dashboard-card-radius);
    border: 1px solid var(--color-border);
    background:
      linear-gradient(145deg, color-mix(in srgb, var(--color-bg-card) 96%, white), var(--color-bg-card)),
      var(--color-bg-card);
    box-shadow: 0 18px 48px rgba(43, 43, 43, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.55);
    transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
  }

  .project-card-surface:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--dashboard-accent) 32%, var(--color-border));
    box-shadow: 0 24px 58px rgba(43, 43, 43, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.65);
  }

  .sa-hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--dashboard-accent);
  }
  .sa-hero-eyebrow::before {
    content: '';
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 999px;
    background: var(--dashboard-accent);
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--dashboard-accent) 14%, transparent);
  }
  .sa-hero-title {
    font-size: clamp(2.3rem, 6vw, 4.65rem);
    font-weight: 900;
    letter-spacing: -0.055em;
    line-height: 0.95;
    color: var(--color-text-primary);
    margin: 0;
  }
  .sa-hero-title span {
    color: var(--dashboard-accent);
  }
  .sa-hero-sub {
    font-size: clamp(0.98rem, 1.5vw, 1.08rem);
    color: var(--color-text-secondary);
    font-weight: 400;
    max-width: 42rem;
    line-height: 1.72;
  }

  .sa-stats {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .sa-stat {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    background: color-mix(in srgb, var(--color-bg-card) 88%, var(--dashboard-surface-tint));
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 12px;
    color: var(--color-text-secondary);
  }
  .sa-stat-num {
    color: var(--color-text-primary);
    font-size: 15px;
    font-weight: 750;
  }

  .project-search-shell input {
    border-radius: 1.1rem;
    border-color: var(--color-border);
    background: var(--color-bg-card);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  }

  .project-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(1rem, 3vw, 2rem);
    background:
      radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--dashboard-surface-tint) 34%, transparent), transparent 34rem),
      rgba(43, 43, 43, 0.28);
    backdrop-filter: blur(18px);
  }

  .project-modal-card {
    width: min(100%, 61rem);
    max-height: min(92vh, 46rem);
    display: grid;
    grid-template-columns: minmax(16rem, 0.78fr) minmax(0, 1fr);
    overflow: auto;
    border-radius: calc(var(--dashboard-card-radius) + 0.5rem);
    border: 1px solid color-mix(in srgb, var(--color-border) 82%, var(--dashboard-accent));
    background: var(--color-bg-card);
    box-shadow: 0 30px 90px rgba(43, 43, 43, 0.22), inset 0 1px 0 rgba(255,255,255,0.72);
  }

  .project-modal-aside {
    position: relative;
    min-height: 100%;
    padding: clamp(1.5rem, 3vw, 2.35rem);
    background:
      linear-gradient(160deg, color-mix(in srgb, var(--dashboard-surface-tint) 72%, white), var(--color-bg));
    border-right: 1px solid var(--color-border);
  }

  .project-modal-aside::after {
    content: '';
    position: absolute;
    inset: auto 1.5rem 1.5rem auto;
    width: 6.5rem;
    height: 6.5rem;
    border: 1px solid color-mix(in srgb, var(--dashboard-accent) 30%, var(--color-border));
    border-radius: 2rem;
    transform: rotate(8deg);
    opacity: 0.5;
  }

  .project-modal-kicker {
    display: inline-flex;
    margin-bottom: 0.75rem;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.68rem;
    font-weight: 760;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--dashboard-accent);
  }

  .project-modal-aside h2,
  .project-modal-form-header h3 {
    margin: 0;
    color: var(--color-text-primary);
    letter-spacing: -0.04em;
    line-height: 0.98;
  }

  .project-modal-aside h2 {
    font-size: clamp(2rem, 5vw, 3.45rem);
  }

  .project-modal-aside p,
  .project-modal-form-header p {
    margin: 1rem 0 0;
    color: var(--color-text-secondary);
    line-height: 1.65;
  }

  .project-modal-steps {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 0.65rem;
    margin-top: 2rem;
  }

  .project-modal-steps span {
    width: fit-content;
    border: 1px solid color-mix(in srgb, var(--dashboard-accent) 28%, var(--color-border));
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-bg-card) 88%, var(--dashboard-surface-tint));
    padding: 0.45rem 0.75rem;
    font-size: 0.78rem;
    font-weight: 760;
    color: var(--color-text-primary);
    box-shadow: 0 8px 18px rgba(43, 43, 43, 0.06);
  }

  .project-modal-form {
    padding: clamp(1.35rem, 3vw, 2.25rem);
  }

  .project-modal-form-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.35rem;
  }

  .project-modal-form-header h3 {
    font-size: clamp(1.55rem, 3vw, 2.2rem);
  }

  .project-modal-close {
    flex: 0 0 auto;
    width: 2.5rem;
    height: 2.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    border-radius: 0.9rem;
    background: var(--color-bg);
    color: var(--color-text-secondary);
    transition: background 160ms ease, color 160ms ease, transform 160ms ease;
  }

  .project-modal-close:hover {
    background: var(--dashboard-surface-tint);
    color: var(--color-text-primary);
    transform: translateY(-1px);
  }

  .project-field {
    display: grid;
    gap: 0.55rem;
    margin-top: 1rem;
  }

  .project-field span {
    color: var(--color-text-primary);
    font-size: 0.88rem;
    font-weight: 720;
  }

  .project-field input,
  .project-field textarea,
  .project-field select {
    width: 100%;
    border: 1px solid var(--color-border);
    border-radius: 1.05rem;
    background: color-mix(in srgb, var(--color-bg) 76%, white);
    color: var(--color-text-primary);
    padding: 0.92rem 1rem;
    outline: none;
    transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
  }

  .project-field textarea {
    min-height: 8.25rem;
    resize: vertical;
    line-height: 1.55;
  }

  .project-field input:focus,
  .project-field textarea:focus,
  .project-field select:focus {
    border-color: var(--dashboard-accent);
    background: var(--color-bg-card);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--dashboard-accent) 14%, transparent);
  }

  .project-field small {
    justify-self: end;
    color: var(--color-text-muted);
    font-size: 0.73rem;
  }

  .project-modal-note {
    margin-top: 1rem;
    border: 1px solid color-mix(in srgb, var(--dashboard-accent) 18%, var(--color-border));
    border-radius: 1.05rem;
    background: color-mix(in srgb, var(--dashboard-surface-tint) 44%, var(--color-bg-card));
    padding: 0.85rem 1rem;
    color: var(--color-text-secondary);
    font-size: 0.84rem;
    line-height: 1.5;
  }

  .project-modal-note strong {
    color: var(--color-text-primary);
  }

  .project-modal-actions {
    display: grid;
    grid-template-columns: 0.8fr 1.2fr;
    gap: 0.75rem;
    margin-top: 1.2rem;
  }

  .project-secondary-action,
  .project-primary-action {
    min-height: 3rem;
    border-radius: 1rem;
    font-weight: 760;
    transition: transform 160ms ease, background 160ms ease, opacity 160ms ease;
  }

  .project-secondary-action {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-secondary);
  }

  .project-primary-action {
    border: 1px solid var(--dashboard-accent);
    background: var(--dashboard-accent);
    color: var(--color-accent-foreground);
    box-shadow: 0 16px 34px rgba(114, 87, 53, 0.22);
  }

  .project-secondary-action:hover,
  .project-primary-action:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .project-primary-action:hover:not(:disabled) {
    background: var(--dashboard-accent-hover);
  }

  .project-primary-action:disabled {
    cursor: not-allowed;
    opacity: 0.56;
  }

  @media (max-width: 860px) {
    .project-modal-card {
      grid-template-columns: 1fr;
    }
    .project-modal-aside {
      border-right: 0;
      border-bottom: 1px solid var(--color-border);
    }
  }

  @media (max-width: 760px) {
    .dashboard-actions-bar {
      grid-template-columns: 1fr;
    }
    .dashboard-actions-hint {
      padding: 0 0.25rem 0.2rem;
    }
    .dashboard-panel {
      border-radius: 1.25rem;
    }
    .project-modal-actions {
      grid-template-columns: 1fr;
    }
  }
`
