export const DASHBOARD_STYLES = `
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
  .flip-card:hover .flip-card-inner {
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

  .sa-hero-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-accent);
  }
  .sa-hero-title {
    font-size: clamp(2rem, 5vw, 3.25rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.05;
    color: var(--color-text-primary);
    margin: 0;
  }
  .sa-hero-title span {
    color: var(--color-accent);
  }
  .sa-hero-sub {
    font-size: 15px;
    color: var(--color-text-secondary);
    font-weight: 400;
    max-width: 480px;
    line-height: 1.6;
  }

  .sa-stats {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .sa-stat {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 999px;
    border: 0.5px solid var(--color-border);
    background: var(--color-bg-card);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--color-text-secondary);
  }
  .sa-stat-num {
    color: var(--color-text-primary);
    font-weight: 500;
  }
`