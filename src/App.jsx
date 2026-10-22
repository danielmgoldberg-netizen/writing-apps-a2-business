import { useState } from "react";
import PepsiCoBusinessTutor from "./apps/PepsiCoBusinessTutor.jsx";

// Same macOS tokens as DesktopShell in the main writing-apps project, inlined
// here because this project has no shared components folder.
const FONT_STACK = `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif`;

const appStyles = `
  * { box-sizing: border-box; }
  body { margin: 0; }

  .app-screen {
    --ds-large-title: 26px;
    --ds-title-2: 17px;
    --ds-body: 13px;
    --ds-label: #1D1D1F;
    --ds-secondary-label: rgba(0, 0, 0, 0.5);
    --ds-tertiary-label: rgba(0, 0, 0, 0.26);
    --ds-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

    min-height: 100vh;
    background: #F5F5F7;
    padding: 72px 20px 60px;
    font-family: ${FONT_STACK};
    font-size: var(--ds-body);
    color: var(--ds-label);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .app-panel {
    max-width: 520px;
    margin: 0 auto;
    animation: app-fade-in 0.45s var(--ds-ease) both;
  }
  @keyframes app-fade-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .app-header { text-align: center; margin-bottom: 32px; }
  .app-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    border-radius: 15px;
    background: linear-gradient(180deg, #4AA3FF 0%, #007AFF 100%);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 6px 16px rgba(0, 122, 255, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
  }
  .app-title {
    font-size: var(--ds-large-title);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin: 0;
  }

  /* Exercise menu: list of large, clickable rows */
  .app-exercise {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
    padding: 18px 20px;
    text-align: left;
    font-family: inherit;
    color: inherit;
    background: #FFFFFF;
    border: 0.5px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 14px rgba(0, 0, 0, 0.04);
    cursor: default;
    transition: box-shadow 0.2s var(--ds-ease), transform 0.2s var(--ds-ease);
  }
  .app-exercise:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05), 0 10px 24px rgba(0, 0, 0, 0.08);
  }
  .app-exercise:active { transform: scale(0.99); }
  .app-exercise:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.35); }
  .app-exercise-icon {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  .app-exercise-body { flex: 1; min-width: 0; }
  .app-exercise-title {
    font-size: var(--ds-title-2);
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 3px;
  }
  .app-exercise-desc {
    font-size: var(--ds-body);
    color: var(--ds-secondary-label);
    line-height: 1.5;
  }
  .app-chevron {
    flex-shrink: 0;
    color: var(--ds-tertiary-label);
    font-size: 22px;
    line-height: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .app-panel { animation: none; }
    .app-exercise { transition: none; }
  }
`;

export default function App() {
  const [current, setCurrent] = useState(null);

  if (current === "business") {
    return <PepsiCoBusinessTutor onBack={() => setCurrent(null)} />;
  }

  return (
    <div className="app-screen">
      <style>{appStyles}</style>

      <div className="app-panel">
        <header className="app-header">
          <div className="app-icon" aria-hidden="true">✍️</div>
          <h1 className="app-title">Business Writing Practice</h1>
        </header>

        <button className="app-exercise" onClick={() => setCurrent("business")}>
          <div className="app-exercise-icon" style={{ background: "rgba(52, 199, 89, 0.14)" }} aria-hidden="true">📈</div>
          <div className="app-exercise-body">
            <div className="app-exercise-title">Business Writing Tutor</div>
            <div className="app-exercise-desc">
              Write a three-paragraph essay responding to investment analysts' recommendations. Earn up to 20 points.
            </div>
          </div>
          <span className="app-chevron" aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}
