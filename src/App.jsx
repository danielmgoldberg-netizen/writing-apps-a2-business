import { useState } from "react";
import PepsiCoBusinessTutor, { TEACHERS } from "./apps/PepsiCoBusinessTutor.jsx";

// Mirrors the tutor's own look (cream page, Fraunces headings, Plus Jakarta Sans,
// beige-bordered cards, green accent) so the landing page and tutor feel like one app.
const appStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; }

  .app-screen {
    min-height: 100vh;
    background: #FAF6ED;
    padding: 28px 16px 60px;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: #1F1B16;
  }
  .app-panel {
    max-width: 720px;
    margin: 0 auto;
    animation: app-fade-in 0.4s ease both;
  }
  @keyframes app-fade-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .app-header { margin: 34px 0 20px; padding-left: 4px; }
  .app-title {
    font-family: 'Fraunces', serif;
    font-size: 30px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: #1F1B16;
    margin: 0;
  }

  .app-card {
    background: #FFFFFF;
    border: 1px solid #E8E0D0;
    border-radius: 14px;
    padding: 22px 26px;
    margin-bottom: 18px;
  }
  .app-card-title {
    font-family: 'Fraunces', serif;
    font-size: 21px;
    font-weight: 500;
    color: #1F1B16;
    margin: 0 0 12px;
  }
  .app-card-subtitle {
    font-size: 14px;
    color: #5A4D43;
    line-height: 1.6;
    margin: 0 0 18px;
  }

  .app-field-row { display: flex; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
  .app-field-row > div { flex: 1; min-width: 160px; }
  .app-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #6B5D54;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: 6px;
  }
  .app-input,
  .app-select {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid #DDD2BC;
    border-radius: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px;
    color: #1F1B16;
    background: #FDFAF2;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .app-input::placeholder { color: #A89B85; }
  .app-select {
    cursor: pointer;
    appearance: none;
    padding-right: 40px;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%236B5D54' d='M6 8L0 0h12z'/></svg>");
    background-repeat: no-repeat;
    background-position: right 16px center;
  }
  .app-input:focus,
  .app-select:focus {
    border-color: #2D5043;
    box-shadow: 0 0 0 3px rgba(45, 80, 67, 0.12);
  }

  .app-section-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #6B5D54;
    margin: 0 4px 8px;
  }
  .app-hint {
    margin: 4px 4px 0;
    font-size: 13px;
    color: #6B5D54;
  }

  /* Exercise menu: large, clickable rows */
  .app-exercise {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
    padding: 20px 24px;
    text-align: left;
    font-family: inherit;
    color: inherit;
    background: #FFFFFF;
    border: 1px solid #E8E0D0;
    border-top: 3px solid #2D5043;
    border-radius: 14px;
    cursor: pointer;
    transition: box-shadow 0.15s ease, transform 0.1s ease, opacity 0.15s ease;
  }
  .app-exercise:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
  .app-exercise:active:not(:disabled) { transform: translateY(0); }
  .app-exercise:disabled { opacity: 0.55; cursor: not-allowed; }
  .app-exercise:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(45, 80, 67, 0.2); }
  .app-exercise-icon {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 10px;
    background: #FDFAF2;
    border: 1px solid #EDE3CE;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  .app-exercise-body { flex: 1; min-width: 0; }
  .app-exercise-title {
    font-family: 'Fraunces', serif;
    font-size: 21px;
    font-weight: 500;
    color: #1F1B16;
    margin-bottom: 4px;
  }
  .app-exercise-desc {
    font-size: 14.5px;
    color: #6B5D54;
    line-height: 1.55;
  }
  .app-chevron {
    flex-shrink: 0;
    color: #2D5043;
    font-size: 24px;
    line-height: 1;
  }

  @media (max-width: 600px) {
    .app-card { padding: 18px 16px; }
    .app-exercise { padding: 18px 16px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .app-panel { animation: none; }
    .app-exercise { transition: none; }
  }
`;

export default function App() {
  const [current, setCurrent] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [teacher, setTeacher] = useState("");

  if (current === "business") {
    return (
      <PepsiCoBusinessTutor
        onBack={() => setCurrent(null)}
        firstName={firstName.trim()}
        surname={surname.trim()}
        teacher={teacher}
      />
    );
  }

  const ready = firstName.trim() && surname.trim() && teacher;

  return (
    <div className="app-screen">
      <style>{appStyles}</style>

      <div className="app-panel">
        <header className="app-header">
          <h1 className="app-title">Business Writing Assignment</h1>
        </header>

        <section className="app-card">
          <h2 className="app-card-title">👋 Welcome! Please introduce yourself.</h2>
          <p className="app-card-subtitle">Fill in all three fields, then choose your exercise below.</p>

          <div className="app-field-row">
            <div>
              <label className="app-label" htmlFor="app-first-name">First name</label>
              <input
                id="app-first-name"
                type="text"
                className="app-input"
                placeholder="e.g. Yuval"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="app-label" htmlFor="app-surname">Surname</label>
              <input
                id="app-surname"
                type="text"
                className="app-input"
                placeholder="e.g. Cohen"
                value={surname}
                onChange={e => setSurname(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="app-label" htmlFor="app-teacher">My teacher is</label>
            <select
              id="app-teacher"
              className="app-select"
              value={teacher}
              onChange={e => setTeacher(e.target.value)}
            >
              <option value="">Select your teacher…</option>
              {TEACHERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </section>

        <div className="app-section-label">Exercise</div>
        <button className="app-exercise" disabled={!ready} onClick={() => setCurrent("business")}>
          <div className="app-exercise-icon" aria-hidden="true">📈</div>
          <div className="app-exercise-body">
            <div className="app-exercise-title">Business Writing Tutor</div>
            <div className="app-exercise-desc">
              Write a three-paragraph essay responding to investment analysts' recommendations. Earn up to 20 points.
            </div>
          </div>
          <span className="app-chevron" aria-hidden="true">›</span>
        </button>
        {!ready && (
          <div className="app-hint">Fill in your name and teacher above to start.</div>
        )}
      </div>
    </div>
  );
}
