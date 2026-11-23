import { useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// SESSION LOGGING
// One Airtable record per session (= one API call), not one per attempt.
// A session is one text worked on by one student. It ends when the student
// picks another text, clicks "New text", goes back to the Writing Dashboard,
// or closes / leaves the page. Sessions with zero graded attempts are never
// logged.
//
// The record holds: Student Name, Teacher, Timestamp (session end), App,
// Text Title, Attempts, Score (best score in the session), Max Score.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_LOGGER_URL = "https://writing-app-logger.vercel.app/api/log";

function sendSession(url, payload) {
  try {
    // text/plain keeps this a "simple" cross-origin request (no CORS
    // preflight), and keepalive lets it finish even if the tab is closing.
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  } catch (e) { /* never surface logging problems to students */ }
}

export default function useSessionLog({ app, maxScore, firstName, surname, teacher, url = DEFAULT_LOGGER_URL }) {
  const identity = useRef({});
  identity.current = { app, maxScore, firstName, surname, teacher, url };

  const session = useRef({ textTitle: "", attempts: 0, best: 0, logged: false });

  // reset=false is used when the page is being hidden: the session is sent
  // but kept, so a restored page can carry on counting.
  const end = (reset = true) => {
    const s = session.current;
    if (s.attempts > 0 && !s.logged) {
      s.logged = true;
      const id = identity.current;
      sendSession(id.url, {
        "Student Name": `${id.firstName || ""} ${id.surname || ""}`.trim(),
        "Teacher":      String(id.teacher || ""),
        "Timestamp":    new Date().toISOString(),
        "App":          id.app,
        "Text Title":   s.textTitle,
        "Attempts":     s.attempts,
        "Score":        s.best,
        "Max Score":    id.maxScore
      });
    }
    if (reset) session.current = { textTitle: "", attempts: 0, best: 0, logged: false };
  };

  const recordAttempt = (textTitle, score) => {
    const s = session.current;
    // If the page was hidden and restored (e.g. back/forward cache) after the
    // session was already sent, keep counting and send the full totals again when it ends
    // (rare: gives a second, more complete record for that session).
    if (s.logged) s.logged = false;
    s.textTitle = textTitle;
    s.attempts += 1;
    s.best = Math.max(s.best, Number(score) || 0);
  };

  useEffect(() => {
    const onPageHide = () => end(false);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      end(); // leaving the app component (e.g. back to the dashboard)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { recordAttempt, end };
}
