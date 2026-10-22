import { useState, useRef, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// LOGGING CONFIG
// Submissions are sent to the Vercel proxy which writes to Airtable.
// ─────────────────────────────────────────────────────────────────────────────
const LOGGER_URL = "https://writing-app-logger.vercel.app/api/log-a2";
const GRADER_URL = "https://writing-app-logger.vercel.app/api/grade";

function logToAirtable({ firstName, surname, teacher, attemptNumber, submission, totalScore }) {
  setTimeout(() => {
    try {
      fetch(LOGGER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "Student Name": String(`${firstName} ${surname}`.trim()),
          "Teacher":      String(teacher || ""),
          "Timestamp":    new Date().toISOString(),
          "App":          "a2-business",
          "Text Title":   "PepsiCo",
          "Attempts":     Number(attemptNumber || 1),
          "Submission":   String(submission || "").slice(0, 2000),
          "Score":        Number(totalScore || 0),
          "Max Score":    20
        })
      }).catch(() => {});
    } catch (e) { /* never surface */ }
  }, 0);
}

const TEACHERS = ["Miriam", "Yohanna", "Rita", "Keren", "Daniel", "Chana", "Louise"];

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE MATERIAL
// ─────────────────────────────────────────────────────────────────────────────
const ESSAY_QUESTION = "Do you agree or disagree with the investment analysts' recommendation for PepsiCo?";

const SOURCE_TEXT = "Under Indra Nooyi's leadership, PepsiCo, a global food and beverage company, introduced a strategy called Performance with Purpose, which aimed to combine strong financial results with greater attention to consumer health, environmental sustainability, and employee well-being. The company's extensive portfolio includes well-known brands such as Pepsi, Lay's, and Tropicana. Through increased investment in research and development, PepsiCo managed to reduce salt, sugar, and fat in many of its core products without sacrificing taste. It also expanded its range of more nutritious foods and beverages and developed new packaging and production methods to reduce its environmental impact. These efforts contributed to the company's financial success: after the strategy was introduced, its net revenue increased substantially, and its stock outperformed major market indices. However, transforming the company was not easy. Some employees continued to follow traditional business practices, and changing long-established marketing habits met with resistance. Meanwhile, growing consumer interest in health and wellness offered new possibilities for developing products that met changing needs. At the same time, concerns about obesity and diabetes, together with increasing pressure to conserve water and reduce plastic waste, presented significant challenges for the company's future growth. In addition, an activist investor challenged the company's direction, arguing that it should focus more heavily on its traditional snacks and sugary beverages rather than its broader sustainability goals.";

const APA_REFERENCE = "Nooyi, I. K., & Govindarajan, V. (2020, March–April). Becoming a better corporate citizen: How PepsiCo moved toward a healthier future. Harvard Business Review. https://hbr.org/2020/03/becoming-a-better-corporate-citizen";
const APA_URL = "https://hbr.org/2020/03/becoming-a-better-corporate-citizen";

const CNN_QUOTE_URL = "https://edition.cnn.com/markets/stocks/PEP#quote";
const CNN_FORECAST_URL = "https://edition.cnn.com/markets/stocks/PEP#forecasts";

// Approximate monthly closing prices for practice only. Students are sent to
// CNN for the live figures.
const STOCK_DATA = [
  { month: "Oct '24", price: 175 },
  { month: "Nov '24", price: 166 },
  { month: "Dec '24", price: 155 },
  { month: "Jan '25", price: 150 },
  { month: "Feb '25", price: 153 },
  { month: "Mar '25", price: 150 },
  { month: "Apr '25", price: 145 },
  { month: "May '25", price: 141 },
  { month: "Jun '25", price: 140 },
  { month: "Jul '25", price: 143 },
  { month: "Aug '25", price: 145 },
  { month: "Sep '25", price: 142 }
];

const ANALYST_DATA = [
  { name: "Buy", value: 30, color: "#2D5043" },
  { name: "Hold", value: 45, color: "#C99452" },
  { name: "Sell", value: 25, color: "#B85C38" }
];

const KEY_FACTS = {
  overview: [
    "PepsiCo: global food and beverage company",
    "Key brands: Pepsi, Lay's, Tropicana, Gatorade, Quaker",
    "Strategy: Performance with Purpose (introduced under Indra Nooyi)"
  ],
  swot: [
    {
      label: "Strengths", emoji: "💪", color: "#2D5043", bg: "#E8EFE9", border: "#B5C9B8",
      items: [
        "Reduced salt, sugar and fat in products",
        "Expanded its range of nutritious foods and drinks",
        "New packaging to cut environmental impact",
        "Net revenue increased substantially",
        "Stock outperformed major market indices"
      ]
    },
    {
      label: "Weaknesses", emoji: "⚠️", color: "#8A6F30", bg: "#F8F1E1", border: "#E3D3AE",
      items: [
        "Resistance to change inside the company",
        "Slow transformation of marketing habits"
      ]
    },
    {
      label: "Opportunities", emoji: "🌱", color: "#2C5A87", bg: "#EDF3FA", border: "#BCD3EC",
      items: [
        "Growing consumer interest in health and wellness",
        "Demand for sustainable products"
      ]
    },
    {
      label: "Threats", emoji: "🌩️", color: "#B4472B", bg: "#F8E5DC", border: "#E0B8A0",
      items: [
        "Concerns about obesity and diabetes",
        "Pressure to conserve water and reduce plastic waste",
        "Activist investor pressure to refocus on traditional products"
      ]
    }
  ]
};

const CONNECTOR_GROUPS = {
  "Addition": ["Furthermore", "Moreover", "In addition", "Additionally", "Also"],
  "Contrast": ["However", "Nevertheless", "On the other hand", "Although", "Despite"],
  "Cause / Effect": ["Therefore", "Consequently", "As a result", "Thus", "Hence"],
  "Example": ["For example", "For instance"],
  "Sequence": ["Firstly", "Secondly", "Finally", "Subsequently"],
  "Conclusion": ["In conclusion", "To summarize", "Overall"]
};
const ALL_CONNECTORS = Object.values(CONNECTOR_GROUPS).flat().map(c => c.toLowerCase());

const TREND_GROUPS = {
  "Going up ↗": ["rose", "climbed", "increased", "gained", "surged", "jumped", "soared", "peaked"],
  "Going down ↘": ["fell", "declined", "dropped", "decreased", "plummeted", "slumped", "tumbled"],
  "Staying steady →": ["held steady", "remained stable", "plateaued", "leveled off"],
  "Up and down ↕": ["fluctuated", "varied", "oscillated"],
  "Modifiers": ["dramatically", "sharply", "slightly", "gradually", "steadily", "significantly"]
};
const TREND_STEMS = [
  "rise", "rose", "risen", "climb", "increas", "gain", "surg", "jump", "soar", "peak",
  "fell", "fall", "declin", "drop", "decreas", "plummet", "slump", "tumbl",
  "held steady", "remain", "plateau", "level", "fluctuat", "vari", "oscillat"
];

const PARAGRAPHS = [
  {
    key: "p1", num: 1, category: "paragraph1", title: "Introduction", pts: 3, lo: 40, hi: 70,
    reminders: [
      "Introduce PepsiCo and state its core competency.",
      "Mention at least one major brand.",
      "End by saying whether you agree or disagree with the analysts."
    ]
  },
  {
    key: "p2", num: 2, category: "paragraph2", title: "Main body", pts: 5, lo: 100, hi: 160,
    reminders: [
      "Open with PepsiCo's stock performance over the last year, using language of trends.",
      "State and explain at least one strength OR weakness from the text.",
      "State and explain at least one opportunity OR threat from the text.",
      "Say whether the strengths and opportunities outweigh the weaknesses and threats.",
      "Explain why you agree or disagree with the analysts. Use the text and your own opinion, with an APA citation."
    ]
  },
  {
    key: "p3", num: 3, category: "paragraph3", title: "Conclusion", pts: 2, lo: 35, hi: 60,
    reminders: [
      "Restate your answer in different words.",
      "Give your personal opinion about PepsiCo's ability to handle future challenges.",
      "Do not add new arguments."
    ]
  }
];

const CATEGORY_MAX = {
  paragraph1: 3,
  paragraph2: 5,
  paragraph3: 2,
  citation: 2,
  format: 2,
  connectors: 3,
  language: 2,
  trends: 1
};

const CATEGORY_LABELS = {
  paragraph1: "Paragraph 1 — Introduction",
  paragraph2: "Paragraph 2 — Main body",
  paragraph3: "Paragraph 3 — Conclusion",
  citation: "APA citation",
  format: "Format",
  connectors: "Connectors",
  language: "Language",
  trends: "Language of trends"
};

const CATEGORY_EMOJIS = {
  paragraph1: "1️⃣",
  paragraph2: "2️⃣",
  paragraph3: "3️⃣",
  citation: "📚",
  format: "🔠",
  connectors: "🔗",
  language: "✍️",
  trends: "📈"
};

const CATEGORY_DOTS = {
  paragraph1: "#2D5043",
  paragraph2: "#2D5043",
  paragraph3: "#2D5043",
  citation: "#2C5A87",
  format: "#8A6F30",
  connectors: "#7A4E8A",
  language: "#B4472B",
  trends: "#B8862E"
};

const MAX_SCORE = 20;

// ─────────────────────────────────────────────────────────────────────────────
// WARM-UP
// ─────────────────────────────────────────────────────────────────────────────
const WARMUP = [
  {
    num: 1,
    prompt: "Look at the stock price chart.",
    parts: [
      { key: "q1i", label: "(i)", text: "By approximately how much did PepsiCo's stock price change over the past year?" },
      { key: "q1ii", label: "(ii)", text: "Describe the most dramatic change you can see, using a language of trends word." }
    ]
  },
  {
    num: 2,
    prompt: "Think about the company and the analysts.",
    parts: [
      { key: "q2a", label: "(a)", text: "What is PepsiCo's core competency?" },
      { key: "q2b", label: "(b)", text: "Do you agree or disagree with the analysts' recommendation? Why? Use at least one trend word and reference the text." }
    ]
  }
];
const WARMUP_KEYS = WARMUP.flatMap(q => q.parts.map(p => p.key));

const VERDICT_STYLES = {
  correct: { label: "✅ Correct", color: "#2D5043", bg: "#E8EFE9", border: "#B5C9B8" },
  partial: { label: "🟡 Partly there", color: "#8A6F30", bg: "#F8F1E1", border: "#E3D3AE" },
  retry:   { label: "🔁 Try again", color: "#B4472B", bg: "#F8E5DC", border: "#E0B8A0" }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROMPTS
// ─────────────────────────────────────────────────────────────────────────────
function serializeContext() {
  return `ESSAY QUESTION: ${ESSAY_QUESTION}

SOURCE TEXT (HBR summary, Nooyi & Govindarajan, 2020):
${SOURCE_TEXT}

APA CITATION FOR THIS TEXT:
- Correct parenthetical: (Nooyi & Govindarajan, 2020)
- Correct narrative: Nooyi and Govindarajan (2020) explain / state / argue / write...
- Wrong examples: (Nooyi & Govindarajan 2020), (Nooyi and Govindarajan, 2020), [Nooyi & Govindarajan, 2020]
- Full reference: ${APA_REFERENCE}

FINANCIAL DATA SHOWN TO STUDENTS (approximate, practice only):
- Stock price, monthly: ${STOCK_DATA.map(d => `${d.month} $${d.price}`).join(", ")}.
- General downward trend from about $175 (late 2024) to about $140–$145 (mid 2025), roughly a 15–20% fall.
- Analyst recommendations: ${ANALYST_DATA.map(d => `${d.value}% ${d.name}`).join(", ")}. The consensus is Hold.

KEY FACTS (SWOT from the text):
${KEY_FACTS.overview.map(f => `- ${f}`).join("\n")}
${KEY_FACTS.swot.map(g => `- ${g.label}: ${g.items.join("; ")}`).join("\n")}`;
}

const SYSTEM_PROMPT = `You are a supportive university writing tutor for an Advanced 2 English course. Your students are B1 to C1 level, writing a three-paragraph business essay. Be honest but kind. Do NOT inflate scores.

${serializeContext()}

PARAGRAPH STRUCTURE (what students must write):
P1 (3 pts): Introduce PepsiCo — state its core competency and at least one major brand. End by stating agree or disagree with the analysts.
P2 (5 pts): Open with PepsiCo's financial performance over the last year using language of trends. State and explain at least one strength OR weakness from the text. State and explain at least one opportunity OR threat from the text. State whether strengths/opportunities outweigh weaknesses/threats. Explain why you agree or disagree with the analysts, using text and own opinion.
P3 (2 pts): Restate the answer in different words. Personal opinion about PepsiCo's ability to handle future challenges.

RUBRIC (20 points total):
- paragraph1: 0–3
- paragraph2: 0–5
- paragraph3: 0–2
- citation: 0–2 (correct APA format and clearly tied to source; 0 if missing, 1 if attempted but malformed, 2 if correct)
- format: 0–2 (capitalization, end punctuation, three clear paragraphs)
- connectors: 0–3 (at least 3 different connectors, one per paragraph, used correctly; 1 point per paragraph)
- language: 0–2 (grammar, vocabulary, word order, subject-verb agreement, business tone)
- trends: 0–1 (language of trends used in P2)

DEDUCTIONS (1 point each):
- Irrelevant information in a paragraph
- Misplacement of content (e.g. financial trends in P1, new arguments in P3)
- Incorrectly formatted citation (stacks: lose citation point AND deduction)

Total: totalScore = sum of all 8 scores minus deductions. Floor 0, cap 20.

GRADING RULES:
- Be strict about: capitalization at sentence start, "I" always capitalized, proper nouns (PepsiCo, Nooyi, Govindarajan, Tropicana, etc.), a period or question mark at the end of every sentence, three distinct paragraphs.
- Both agree and disagree are equally valid. Never grade on the opinion itself, only on how well it is argued.
- For attempts 1, 2, 3: NEVER write a full sample essay. Set sampleEssay to null.
- For attempt 4+, if totalScore < 20: include ONE complete sample essay (180–240 words) in sampleEssay, three paragraphs separated by \\n\\n.
- For each lost point: identify the issue and explain what is wrong simply. Give a HINT, never a corrected sentence.
- Always include 1–3 strengths in the strengths array.
- Always include a positive note in encouragement.

EMOJI at the start of encouragement:
- 20/20: 🎉 or ⭐ or ✨
- 15–19: 🌟 or 💪 or 👍
- 10–14: 🌱 or 💛
- 0–9: 🤗

Respond with ONLY valid JSON, no markdown fences, matching exactly:
{
  "scores": {
    "paragraph1": <0-3>,
    "paragraph2": <0-5>,
    "paragraph3": <0-2>,
    "citation": <0-2>,
    "format": <0-2>,
    "connectors": <0-3>,
    "language": <0-2>,
    "trends": <0-1>
  },
  "deductions": [{ "reason": "<max 18 words>", "points": 1 }],
  "totalScore": <integer 0-20>,
  "encouragement": "<one short positive sentence with one emoji at the start, max 18 words>",
  "strengths": ["<short phrase>", ...],
  "issues": [
    {
      "category": "paragraph1|paragraph2|paragraph3|citation|format|connectors|language|trends",
      "quote": "<the student's exact words that caused the issue, or null>",
      "problem": "<one clear sentence explaining what is wrong>",
      "hint": "<one sentence hint, never the corrected version>"
    }
  ],
  "sampleEssay": "<three paragraphs separated by \\n\\n, or null>"
}`;

const WARMUP_SYSTEM = `You are a warm, supportive university writing tutor checking short warm-up answers before a business essay. Students are B1 to C1 level. Be honest but kind. This is practice only: never give a score.

${serializeContext()}

WARM-UP QUESTIONS AND ANSWER KEY:
Q1 (i) By approximately how much did PepsiCo's stock price change over the past year?
Key: The stock fell/declined by approximately 15–25% over the past year (accept any reasonable figure reflecting a downward trend, including a dollar amount of roughly $30–$35). Student must use a trend word.
Q1 (ii) Describe the most dramatic change you can see, using a language of trends word.
Key: The most dramatic change was the gradual decline/fall from around $175 (late 2024) to around $140–$145 (mid 2025). Accept reasonable approximations with a strong trend word (a sharp drop between Oct and Dec 2024 is also acceptable).
Q2 (a) What is PepsiCo's core competency?
Key: PepsiCo is a global food and beverage company. Core competency: manufacturing and selling food and beverage products under multiple well-known brands (Pepsi, Lay's, Tropicana, etc.). Accept any answer referencing the text.
Q2 (b) Do you agree or disagree with the analysts' recommendation? Why? Use at least one trend word and reference the text.
Key: Student must (a) clearly state agree or disagree; (b) reference the analyst recommendations; (c) use at least one trend word; (d) reference the text. "partial" if some but not all elements are present. Both agree and disagree are equally valid.

RULES:
- verdict is "correct", "partial" or "retry". Use "retry" for blank or off-topic answers.
- comment: one short sentence saying what is good or what is missing.
- hint: one short sentence guiding the student, never the full answer. Use null if the answer is fully correct.

Respond with ONLY valid JSON, no markdown fences:
{
  "q1i":  { "verdict": "...", "comment": "...", "hint": "... or null" },
  "q1ii": { "verdict": "...", "comment": "...", "hint": "... or null" },
  "q2a":  { "verdict": "...", "comment": "...", "hint": "... or null" },
  "q2b":  { "verdict": "...", "comment": "...", "hint": "... or null" }
}`;

function buildUserPrompt(p1, p2, p3, attemptNumber) {
  return `ATTEMPT NUMBER: ${attemptNumber}

PARAGRAPH 1:
${p1}

PARAGRAPH 2:
${p2}

PARAGRAPH 3:
${p3}`;
}

function buildWarmupPrompt(answers) {
  return WARMUP.flatMap(q => q.parts.map(p =>
    `Q${q.num} ${p.label} ${p.text}\nSTUDENT ANSWER: ${answers[p.key].trim() || "(blank)"}`
  )).join("\n\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function countWords(s) {
  const m = (s || "").trim().match(/\S+/g);
  return m ? m.length : 0;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countConnectors(text) {
  const t = (text || "").toLowerCase();
  let n = 0;
  for (const c of ALL_CONNECTORS) {
    const re = new RegExp(`(^|[^a-z])${escapeRegex(c)}([^a-z]|$)`, "g");
    const m = t.match(re);
    if (m) n += m.length;
  }
  return n;
}

function countTrendWords(text) {
  const words = (text || "").toLowerCase().match(/[a-z]+(?:\s+steady)?/g) || [];
  return words.filter(w => TREND_STEMS.some(s => w.startsWith(s))).length;
}

function countCitations(text) {
  const m = (text || "").match(/\([^()]*\b\d{4}\b[^()]*\)/g);
  return m ? m.length : 0;
}

function wcColor(wc, lo, hi) {
  if (wc >= lo && wc <= hi) return "#2D5043";        // green — on target
  if (wc >= lo * 0.75 && wc < lo) return "#B8862E";  // amber — near target
  if (wc > hi && wc <= hi * 1.3) return "#B8862E";   // amber — a bit long
  return "#B4472B";                                  // red — off target
}

function validateSubmission(p1, p2, p3) {
  if (!p1.trim() || !p2.trim() || !p3.trim()) {
    return "⚠️ Please write all three paragraphs before getting feedback.";
  }
  if (countWords(p1) + countWords(p2) + countWords(p3) < 60) {
    return "⚠️ Your essay looks very short. Try to develop each paragraph a little more before asking for feedback.";
  }
  return null;
}

function ensureEndPunct(text) {
  if (!text || typeof text !== "string") return text;
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const last = trimmed.slice(-1);
  if (last === "." || last === "!" || last === "?") return trimmed;
  return trimmed + ".";
}

const CATEGORY_ALIASES = {
  p1: "paragraph1", "paragraph 1": "paragraph1", intro: "paragraph1", introduction: "paragraph1",
  p2: "paragraph2", "paragraph 2": "paragraph2", body: "paragraph2", "main body": "paragraph2", mainbody: "paragraph2",
  p3: "paragraph3", "paragraph 3": "paragraph3", conclusion: "paragraph3",
  apa: "citation", citations: "citation", reference: "citation", references: "citation",
  presentation: "format", capitalization: "format", punctuation: "format",
  connector: "connectors", linking: "connectors",
  grammar: "language", vocabulary: "language",
  trend: "trends", "language of trends": "trends"
};

function normalizeCategory(cat) {
  if (CATEGORY_MAX[cat]) return cat;
  const key = String(cat || "").trim().toLowerCase();
  return CATEGORY_ALIASES[key] || key;
}

// The total is recomputed from the clamped scores and deductions so the ring
// always matches the bars, whatever the grader wrote in totalScore.
function sanitizeFeedback(feedback, attemptNumber) {
  const scores = {};
  for (const key of Object.keys(CATEGORY_MAX)) {
    const raw = Number(feedback.scores[key]);
    scores[key] = Number.isFinite(raw)
      ? Math.max(0, Math.min(CATEGORY_MAX[key], Math.round(raw)))
      : 0;
  }
  const deductions = Array.isArray(feedback.deductions)
    ? feedback.deductions
        .filter(d => d && d.reason)
        .map(d => ({ reason: ensureEndPunct(String(d.reason)), points: 1 }))
    : [];
  const sum = Object.values(scores).reduce((a, b) => a + b, 0);
  const totalScore = Math.max(0, Math.min(MAX_SCORE, sum - deductions.length));

  const issues = Array.isArray(feedback.issues)
    ? feedback.issues
        .filter(i => i && i.problem)
        .map(i => ({
          category: normalizeCategory(i.category),
          quote: i.quote || null,
          problem: ensureEndPunct(i.problem),
          hint: ensureEndPunct(i.hint)
        }))
    : [];

  const strengths = Array.isArray(feedback.strengths)
    ? feedback.strengths.filter(Boolean).slice(0, 3)
    : [];

  return {
    scores,
    deductions,
    totalScore,
    encouragement: ensureEndPunct(feedback.encouragement) || "🤗 Thank you for your essay — keep going!",
    strengths,
    issues,
    sampleEssay: attemptNumber >= 4 && totalScore < MAX_SCORE && feedback.sampleEssay
      ? String(feedback.sampleEssay)
      : null
  };
}

function extractJson(rawResp) {
  const cleaned = String(rawResp).replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const jsonStr =
    firstBrace >= 0 && lastBrace > firstBrace ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;
  return JSON.parse(jsonStr);
}

function weakestCategoryLabel(feedback) {
  let label = null;
  let ratio = 2;
  for (const key of Object.keys(CATEGORY_MAX)) {
    const r = (feedback.scores[key] || 0) / CATEGORY_MAX[key];
    if (r < ratio) {
      ratio = r;
      label = CATEGORY_LABELS[key];
    }
  }
  return label;
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL UI PIECES
// ─────────────────────────────────────────────────────────────────────────────
function ScoreRing({ score, max = MAX_SCORE }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, score / max));
  const offset = circumference * (1 - progress);
  const color = score >= max * 0.9 ? "#2D5043" : score >= max * 0.7 ? "#7A6B2A" : "#B85C38";
  return (
    <div style={{ position: "relative", width: 108, height: 108, flexShrink: 0 }}>
      <svg width="108" height="108" viewBox="0 0 108 108">
        <circle cx="54" cy="54" r={radius} fill="none" stroke="#E8E0D0" strokeWidth="7" />
        <circle
          cx="54" cy="54" r={radius} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 54 54)"
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center", flexDirection: "column",
        fontFamily: "'Fraunces', serif"
      }}>
        <div style={{ fontSize: 30, fontWeight: 600, color: "#1F1B16", lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 11, color: "#6B5D54", marginTop: 2, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.05em" }}>OF {max}</div>
      </div>
    </div>
  );
}

function CategoryBar({ label, score, max }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const earned = score === max;
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#1F1B16", fontWeight: 500 }}>{label}</span>
        <span style={{
          fontSize: 12, color: earned ? "#2D5043" : "#8A6F30",
          fontVariantNumeric: "tabular-nums", fontWeight: 500
        }}>
          {score} / {max}
        </span>
      </div>
      <div style={{ height: 6, background: "#EFE7D6", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: earned ? "#2D5043" : "#C99452",
          transition: "width 0.5s ease"
        }} />
      </div>
    </div>
  );
}

function Collapsible({ title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="a2-collapse">
      <button className="a2-collapse-head" onClick={() => setOpen(o => !o)} type="button">
        <span>
          {title}
          {subtitle && <span style={{ color: "#8A7B6A", fontWeight: 400 }}> · {subtitle}</span>}
        </span>
        <span className="a2-collapse-icon">{open ? "–" : "+"}</span>
      </button>
      {open && <div className="a2-collapse-body">{children}</div>}
    </div>
  );
}

function LinkButton({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="mit-btn mit-btn-secondary mit-btn-sm" style={{ textDecoration: "none", display: "inline-block" }}>
      {children}
    </a>
  );
}

function IssueCard({ issue }) {
  const dot = CATEGORY_DOTS[issue.category] || "#6B5D54";
  return (
    <div style={{
      padding: "11px 13px 11px 15px",
      background: "#FDFAF2",
      border: "1px solid #EDE3CE",
      borderLeft: `3px solid ${dot}`,
      borderRadius: 8,
      marginBottom: 8
    }}>
      <div style={{
        fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em",
        color: dot, fontWeight: 700, marginBottom: 4
      }}>
        <span style={{ marginRight: 6 }}>{CATEGORY_EMOJIS[issue.category] || "📝"}</span>
        {CATEGORY_LABELS[issue.category] || issue.category}
      </div>
      {issue.quote && (
        <div style={{ fontSize: 13, color: "#6B5D54", marginBottom: 4, lineHeight: 1.5 }}>
          “{issue.quote}”
        </div>
      )}
      <div style={{ fontSize: 14, color: "#1F1B16", marginBottom: 4, lineHeight: 1.5 }}>{issue.problem}</div>
      {issue.hint && (
        <div style={{ fontSize: 13, color: "#5A4D43", lineHeight: 1.5, fontStyle: "italic" }}>
          💡 Hint: {issue.hint}
        </div>
      )}
    </div>
  );
}

function WarmupResult({ result }) {
  if (!result) return null;
  const v = VERDICT_STYLES[result.verdict] || VERDICT_STYLES.partial;
  return (
    <div style={{
      marginTop: 8, padding: "9px 12px", borderRadius: 8,
      background: v.bg, border: `1px solid ${v.border}`
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: v.color, marginBottom: 3 }}>{v.label}</div>
      {result.comment && <div style={{ fontSize: 13, color: "#1F1B16", lineHeight: 1.5 }}>{result.comment}</div>}
      {result.hint && <div style={{ fontSize: 12.5, color: "#5A4D43", lineHeight: 1.5, fontStyle: "italic", marginTop: 2 }}>💡 {result.hint}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARTS
// ─────────────────────────────────────────────────────────────────────────────
function StockChart() {
  return (
    <div className="a2-doc-card" style={{ flex: "1 1 340px", minWidth: 0 }}>
      <div style={chartTitle}>📉 PepsiCo (PEP) stock price</div>
      <div style={{ fontSize: 12, color: "#8A6F30", marginBottom: 10, lineHeight: 1.45 }}>
        ⚠️ Approximate monthly values for practice only. Check CNN for current figures.
      </div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <AreaChart data={STOCK_DATA} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="pepFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2D5043" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2D5043" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#EDE3CE" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10.5, fill: "#6B5D54" }} interval={1} tickLine={false} axisLine={{ stroke: "#DDD2BC" }} />
            <YAxis domain={[130, 180]} tick={{ fontSize: 10.5, fill: "#6B5D54" }} tickFormatter={v => `$${v}`} tickLine={false} axisLine={false} />
            <Tooltip formatter={v => [`$${v}`, "Price"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DDD2BC" }} />
            <Area type="monotone" dataKey="price" stroke="#2D5043" strokeWidth={2} fill="url(#pepFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 10 }}>
        <LinkButton href={CNN_QUOTE_URL}>Live stock price on CNN ↗</LinkButton>
      </div>
    </div>
  );
}

function AnalystChart() {
  return (
    <div className="a2-doc-card" style={{ flex: "1 1 280px", minWidth: 0 }}>
      <div style={chartTitle}>🧑‍💼 Analyst recommendations</div>
      <div style={{ fontSize: 12, color: "#8A6F30", marginBottom: 10, lineHeight: 1.45 }}>
        ⚠️ Approximate breakdown. Check CNN for the current forecast.
      </div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={ANALYST_DATA} dataKey="value" nameKey="name"
              cx="50%" cy="45%" innerRadius={42} outerRadius={72} paddingAngle={2}
              label={({ value }) => `${value}%`} labelLine={false}
            >
              {ANALYST_DATA.map(d => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DDD2BC" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 10 }}>
        <LinkButton href={CNN_FORECAST_URL}>Live analyst forecasts on CNN ↗</LinkButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE CARDS
// ─────────────────────────────────────────────────────────────────────────────
function KeyFacts() {
  return (
    <>
      <ul style={{ margin: "0 0 12px", paddingLeft: 18, display: "grid", gap: 3 }}>
        {KEY_FACTS.overview.map((f, i) => <li key={i} className="a2-body-text">{f}</li>)}
      </ul>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {KEY_FACTS.swot.map(g => (
          <div key={g.label} style={{ background: g.bg, border: `1px solid ${g.border}`, borderRadius: 9, padding: "10px 12px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: g.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
              {g.emoji} {g.label}
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 2 }}>
              {g.items.map((it, i) => <li key={i} style={{ fontSize: 13, color: "#1F1B16", lineHeight: 1.45 }}>{it}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

function WordBank({ groups }) {
  return (
    <div style={{ display: "grid", gap: 9 }}>
      {Object.entries(groups).map(([fn, words]) => (
        <div key={fn}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#2D5043", marginBottom: 3 }}>{fn}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {words.map(w => <span key={w} className="a2-badge">{w}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function CitationGuide() {
  return (
    <div className="a2-body-text">
      <div style={{ marginBottom: 6 }}>✅ Parenthetical: <strong>(Nooyi &amp; Govindarajan, 2020)</strong></div>
      <div style={{ marginBottom: 6 }}>✅ Narrative: <strong>Nooyi and Govindarajan (2020)</strong> explain / state / argue / write…</div>
      <div style={{ marginBottom: 10, color: "#B4472B" }}>
        ❌ (Nooyi &amp; Govindarajan 2020) · (Nooyi and Govindarajan, 2020) · [Nooyi &amp; Govindarajan, 2020]
      </div>
      <div style={kickerStyle}>Full reference</div>
      <div style={{ paddingLeft: 24, textIndent: -24, fontSize: 13 }}>
        Nooyi, I. K., &amp; Govindarajan, V. (2020, March–April). Becoming a better corporate citizen: How PepsiCo moved
        toward a healthier future. <em>Harvard Business Review</em>.{" "}
        <a href={APA_URL} target="_blank" rel="noreferrer" className="a2-link" style={{ wordBreak: "break-word" }}>{APA_URL}</a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App({ onBack }) {
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [teacher, setTeacher] = useState("");
  const [stage, setStage] = useState("welcome"); // welcome | work

  const [warmup, setWarmup] = useState({ q1i: "", q1ii: "", q2a: "", q2b: "" });
  const [warmupResult, setWarmupResult] = useState(null);
  const [warmupLoading, setWarmupLoading] = useState(false);
  const [warmupError, setWarmupError] = useState(null);

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");

  const [attempts, setAttempts] = useState([]);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionBest, setSessionBest] = useState(0);

  const feedbackRef = useRef(null);

  const attemptNumber = attempts.length + 1;
  const pVals = { p1, p2, p3 };
  const pSetters = { p1: setP1, p2: setP2, p3: setP3 };

  useEffect(() => {
    if (currentFeedback && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentFeedback]);

  // ── API plumbing ──────────────────────────────────────────────────────────
  const rawGrade = async ({ system, userPrompt, maxTokens }) => {
    const response = await fetch(GRADER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: userPrompt }]
      })
    });
    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${bodyText.slice(0, 200)}`);
    }
    const data = await response.json();
    const rawResp = (data.content || []).filter(b => b && b.type === "text").map(b => b.text).join("");
    if (!rawResp) throw new Error("Empty response from grader.");
    return rawResp;
  };

  // One call plus one retry, as with the essay grader.
  const withRetry = async (fn) => {
    let lastErr = null;
    for (let i = 0; i < 2; i++) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        console.error(`Grader call failed (attempt ${i + 1}):`, e);
      }
    }
    throw lastErr;
  };

  const callGrader = async (userPrompt, attemptNo) => {
    const rawResp = await rawGrade({ system: SYSTEM_PROMPT, userPrompt, maxTokens: 3000 });
    let parsed;
    try {
      parsed = extractJson(rawResp);
    } catch (e) {
      throw new Error("Grader returned invalid JSON.");
    }
    if (!parsed.scores) throw new Error("Grader response is missing required fields.");
    return sanitizeFeedback(parsed, attemptNo);
  };

  const callWarmup = async (userPrompt) => {
    const rawResp = await rawGrade({ system: WARMUP_SYSTEM, userPrompt, maxTokens: 900 });
    const parsed = extractJson(rawResp);
    const out = {};
    for (const key of WARMUP_KEYS) {
      const r = parsed[key] || {};
      out[key] = {
        verdict: VERDICT_STYLES[r.verdict] ? r.verdict : "partial",
        comment: ensureEndPunct(r.comment),
        hint: r.hint && r.hint !== "null" ? ensureEndPunct(r.hint) : null
      };
    }
    return out;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCheckWarmup = async () => {
    if (warmupLoading) return;
    if (WARMUP_KEYS.every(k => !warmup[k].trim())) {
      setWarmupError("Answer at least one question first.");
      return;
    }
    setWarmupLoading(true);
    setWarmupError(null);
    try {
      const result = await withRetry(() => callWarmup(buildWarmupPrompt(warmup)));
      setWarmupResult(result);
    } catch (e) {
      setWarmupError("Sorry, I couldn't check your answers just now. Please try again in a moment.");
    }
    setWarmupLoading(false);
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    const t1 = p1.trim(), t2 = p2.trim(), t3 = p3.trim();

    const validationError = validateSubmission(t1, t2, t3);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    const thisAttempt = attemptNumber;
    try {
      const feedback = await withRetry(() => callGrader(buildUserPrompt(t1, t2, t3, thisAttempt), thisAttempt));
      setCurrentFeedback(feedback);
      setSessionBest(prev => Math.max(prev, feedback.totalScore));
      setAttempts(prev => [...prev, { p1: t1, p2: t2, p3: t3, feedback }]);
      logToAirtable({
        firstName,
        surname,
        teacher,
        attemptNumber: thisAttempt,
        submission: `${t1}\n\n${t2}\n\n${t3}`,
        totalScore: feedback.totalScore
      });
    } catch (e) {
      const msg = e && e.message ? e.message : "unknown error";
      setError(`Sorry, something went wrong getting your feedback. Please try again in a moment. (${msg.slice(0, 120)})`);
    }
    setIsLoading(false);
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const cardStyle = {
    background: "#FFFFFF",
    border: "1px solid #E8E0D0",
    borderRadius: 14,
    padding: "22px 26px",
    marginBottom: 18
  };
  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#6B5D54",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 6
  };

  const styleTag = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; }

      .mit-textarea {
        width: 100%; padding: 13px 15px;
        border: 1.5px solid #DDD2BC; border-radius: 10px;
        font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15.5px; line-height: 1.55;
        color: #1F1B16; background: #FDFAF2; resize: vertical; outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .mit-textarea:focus { border-color: #2D5043; box-shadow: 0 0 0 3px rgba(45, 80, 67, 0.12); }
      .mit-textarea::placeholder { color: #A89B85; }
      .mit-textarea:disabled { opacity: 0.6; }

      .mit-select, .mit-input {
        width: 100%; padding: 11px 14px;
        border: 1.5px solid #DDD2BC; border-radius: 10px;
        font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px;
        color: #1F1B16; background: #FDFAF2; outline: none;
      }
      .mit-select { cursor: pointer; appearance: none; padding-right: 40px;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%236B5D54' d='M6 8L0 0h12z'/></svg>");
        background-repeat: no-repeat; background-position: right 16px center;
      }
      .mit-select:focus, .mit-input:focus { border-color: #2D5043; box-shadow: 0 0 0 3px rgba(45, 80, 67, 0.12); }

      .mit-btn {
        font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 600;
        padding: 12px 24px; border-radius: 10px; cursor: pointer;
        transition: transform 0.08s ease, background 0.15s ease, opacity 0.15s ease;
        border: none; letter-spacing: 0.01em;
      }
      .mit-btn:active:not(:disabled) { transform: translateY(1px); }
      .mit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
      .mit-btn-primary { background: #2D5043; color: #FAF6ED; }
      .mit-btn-primary:hover:not(:disabled) { background: #234037; }
      .mit-btn-secondary { background: transparent; color: #2D5043; border: 1.5px solid #2D5043; }
      .mit-btn-secondary:hover:not(:disabled) { background: rgba(45, 80, 67, 0.06); }
      .mit-btn-sm { font-size: 13px; padding: 7px 14px; border-radius: 8px; }

      .a2-link { color: #2D5043; text-decoration: underline; }
      .a2-link:hover { color: #234037; }

      .a2-body-text { font-size: 13.5px; line-height: 1.6; color: #2A2520; }

      .a2-collapse { border: 1px solid #EDE3CE; border-radius: 9px; margin-bottom: 8px; overflow: hidden; background: #FFFFFF; }
      .a2-collapse-head {
        width: 100%; text-align: left; background: #FBF6EA; border: none; cursor: pointer;
        font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13.5px; font-weight: 600; color: #1F1B16;
        padding: 11px 13px; display: flex; justify-content: space-between; align-items: center; gap: 10px;
      }
      .a2-collapse-head:hover { background: #F4EEDC; }
      .a2-collapse-icon { color: #2D5043; font-weight: 700; font-size: 15px; flex-shrink: 0; }
      .a2-collapse-body { padding: 12px 14px; border-top: 1px solid #EDE3CE; }

      .a2-doc-card { background: #FDFAF2; border: 1px solid #EDE3CE; border-radius: 10px; padding: 16px 18px; }
      .a2-source { max-height: 260px; overflow-y: auto; }

      .a2-badge {
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 11.5px; font-weight: 600; padding: 3px 8px; border-radius: 999px;
        border: 1px solid #DDD2BC; color: #6B5D54; background: #FDFAF2;
      }

      .mit-spin {
        display: inline-block; width: 13px; height: 13px;
        border: 2px solid rgba(250, 246, 237, 0.4); border-top-color: #FAF6ED;
        border-radius: 50%; animation: mit-spin 0.7s linear infinite; margin-right: 7px; vertical-align: -2px;
      }
      .mit-spin.green { border: 2px solid rgba(45,80,67,0.25); border-top-color: #2D5043; }
      @keyframes mit-spin { to { transform: rotate(360deg); } }

      .mit-fade-in { animation: mit-fade-in 0.4s ease both; }
      @keyframes mit-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

      @media (max-width: 600px) {
        .a2-card-pad { padding: 18px 16px !important; }
      }
    `}</style>
  );

  // ── WELCOME ───────────────────────────────────────────────────────────────
  if (stage === "welcome") {
    const ready = firstName.trim() && surname.trim() && teacher;
    return (
      <div style={pageWrap}>
        {styleTag}
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <TopBar onBack={onBack} />
          <Title />
          <section style={cardStyle} className="mit-fade-in a2-card-pad">
            <h2 style={welcomeH}>👋 Welcome! Please introduce yourself.</h2>
            <p style={{ fontSize: 14, color: "#5A4D43", marginBottom: 18, lineHeight: 1.6 }}>
              Fill in all three fields to begin.
            </p>
            <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={labelStyle}>First name</label>
                <input className="mit-input" placeholder="e.g. Yuval" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={labelStyle}>Surname</label>
                <input className="mit-input" placeholder="e.g. Cohen" value={surname} onChange={e => setSurname(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>My teacher is</label>
              <select className="mit-select" value={teacher} onChange={e => setTeacher(e.target.value)}>
                <option value="">Select your teacher…</option>
                {TEACHERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ textAlign: "right" }}>
              <button className="mit-btn mit-btn-primary" disabled={!ready} onClick={() => setStage("work")}>
                Start ➜
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ── WORK ──────────────────────────────────────────────────────────────────
  const issuesFor = (cat) => (currentFeedback ? currentFeedback.issues.filter(i => i.category === cat) : []);
  const generalIssues = currentFeedback
    ? currentFeedback.issues.filter(i => !PARAGRAPHS.some(p => p.category === i.category))
    : [];

  return (
    <div style={pageWrap}>
      {styleTag}
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <TopBar onBack={onBack} student={`${firstName} ${surname}`} teacher={teacher} />
        <Title />

        {/* QUESTION */}
        <section style={{ ...cardStyle, borderTop: "3px solid #2D5043" }} className="mit-fade-in a2-card-pad">
          <div style={kickerStyle}>Essay question</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 500, color: "#1F1B16", lineHeight: 1.35 }}>
            {ESSAY_QUESTION}
          </div>
        </section>

        {/* SOURCE TEXT */}
        <section style={cardStyle} className="a2-card-pad">
          <h2 style={sectionH}>📄 Source text</h2>
          <div style={{ fontSize: 12.5, color: "#6B5D54", marginBottom: 10 }}>
            HBR summary · Nooyi &amp; Govindarajan (2020)
          </div>
          <div className="a2-doc-card a2-source">
            <p className="a2-body-text" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7 }}>{SOURCE_TEXT}</p>
          </div>
          <div style={{ fontSize: 12, color: "#5A4D43", marginTop: 10, lineHeight: 1.5 }}>
            Cite as <strong style={{ color: "#2D5043" }}>(Nooyi &amp; Govindarajan, 2020)</strong>
          </div>
        </section>

        {/* CHARTS */}
        <section style={cardStyle} className="a2-card-pad">
          <h2 style={sectionH}>📊 Financial data</h2>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <StockChart />
            <AnalystChart />
          </div>
        </section>

        {/* REFERENCE */}
        <section style={cardStyle} className="a2-card-pad">
          <h2 style={sectionH}>🧰 Reference</h2>
          <Collapsible title="🏢 Key facts" subtitle="PepsiCo SWOT" defaultOpen>
            <KeyFacts />
          </Collapsible>
          <Collapsible title="🔗 Connector bank" subtitle="one per paragraph, 3+ different">
            <WordBank groups={CONNECTOR_GROUPS} />
          </Collapsible>
          <Collapsible title="📈 Trends bank" subtitle="use in Paragraph 2">
            <WordBank groups={TREND_GROUPS} />
          </Collapsible>
          <Collapsible title="📚 APA citation" subtitle="how to cite the text">
            <CitationGuide />
          </Collapsible>
        </section>

        {/* WARM-UP */}
        <section style={cardStyle} className="a2-card-pad">
          <h2 style={sectionH}>🔥 Warm-up</h2>
          <p style={{ fontSize: 13.5, color: "#5A4D43", margin: "0 0 14px", lineHeight: 1.55 }}>
            Answer these short questions to prepare your ideas. This is practice and does not count towards your score.
          </p>
          {WARMUP.map(q => (
            <div key={q.num} style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16.5, fontWeight: 500, color: "#1F1B16", marginBottom: 8 }}>
                Question {q.num}. <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#5A4D43" }}>{q.prompt}</span>
              </div>
              {q.parts.map(p => (
                <div key={p.key} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13.5, color: "#1F1B16", marginBottom: 5, lineHeight: 1.5 }}>
                    <strong style={{ color: "#2D5043" }}>{p.label}</strong> {p.text}
                  </div>
                  <textarea
                    className="mit-textarea"
                    style={{ minHeight: p.key === "q2b" ? 100 : 64, fontSize: 14.5 }}
                    value={warmup[p.key]}
                    onChange={e => setWarmup(w => ({ ...w, [p.key]: e.target.value }))}
                    placeholder="Your answer…"
                    disabled={warmupLoading}
                  />
                  <WarmupResult result={warmupResult && warmupResult[p.key]} />
                </div>
              ))}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button className="mit-btn mit-btn-secondary" onClick={handleCheckWarmup} disabled={warmupLoading}>
              {warmupLoading && <span className="mit-spin green" />}
              {warmupLoading ? "Checking…" : "Check my warm-up answers"}
            </button>
            {warmupError && <span style={{ fontSize: 13, color: "#7A3818" }}>{warmupError}</span>}
          </div>
        </section>

        {/* ESSAY HEADER */}
        <div style={{ ...cardStyle, padding: "16px 20px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "baseline" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500, color: "#1F1B16" }}>
              ✍️ Your essay
            </div>
            <div style={{ fontSize: 12.5, color: "#6B5D54" }}>
              {attempts.length === 0
                ? "Attempt 1 (not submitted yet)"
                : `${attempts.length} attempt${attempts.length > 1 ? "s" : ""} · best ${sessionBest}/${MAX_SCORE} · next is attempt ${attemptNumber}`}
            </div>
          </div>
        </div>

        {/* PARAGRAPHS */}
        {PARAGRAPHS.map(para => {
          const val = pVals[para.key];
          const wc = countWords(val);
          const col = wcColor(wc, para.lo, para.hi);
          const conn = countConnectors(val);
          const cites = countCitations(val);
          const trends = countTrendWords(val);
          const paraIssues = issuesFor(para.category);
          return (
            <section key={para.key} style={cardStyle} className="a2-card-pad">
              {paraIssues.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  {paraIssues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 500, color: "#1F1B16" }}>
                  Paragraph {para.num} — {para.title} ({para.pts} pts)
                </div>
                <span style={{ fontSize: 12.5, color: col, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {wc} words · aim {para.lo}–{para.hi}
                </span>
              </div>

              <ul style={{ margin: "8px 0 10px", paddingLeft: 18, display: "grid", gap: 3 }}>
                {para.reminders.map((r, i) => (
                  <li key={i} style={{ fontSize: 12.5, color: "#5A4D43", lineHeight: 1.45 }}>{r}</li>
                ))}
              </ul>

              <textarea
                className="mit-textarea"
                style={{ minHeight: para.key === "p2" ? 230 : 130 }}
                value={val}
                onChange={(e) => { pSetters[para.key](e.target.value); if (error) setError(null); }}
                placeholder={`Write paragraph ${para.num} here…`}
                disabled={isLoading}
              />

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                <span className="a2-badge">🔗 {conn} connector{conn === 1 ? "" : "s"}</span>
                {para.key === "p2" && <span className="a2-badge">📈 {trends} trend word{trends === 1 ? "" : "s"}</span>}
                <span className="a2-badge">📚 {cites} citation{cites === 1 ? "" : "s"}</span>
              </div>
            </section>
          );
        })}

        {/* SUBMIT */}
        <section style={{ ...cardStyle, textAlign: "center" }} className="a2-card-pad">
          <button
            className="mit-btn mit-btn-primary"
            style={{ fontSize: 16, padding: "14px 32px" }}
            onClick={handleSubmit}
            disabled={isLoading || !(p1.trim() && p2.trim() && p3.trim())}
          >
            {isLoading && <span className="mit-spin" />}
            {isLoading ? "Grading your essay…" : `Submit for grading (attempt ${attemptNumber})`}
          </button>
          <div style={{ fontSize: 12, color: "#7A6B60", marginTop: 8 }}>
            This grades all three paragraphs together and counts as an official attempt.
          </div>
          {error && (
            <div style={{
              marginTop: 12, padding: "10px 14px", background: "#F8E5DC",
              border: "1px solid #E0B8A0", borderRadius: 8, fontSize: 13.5, color: "#7A3818", textAlign: "left"
            }}>
              {error}
            </div>
          )}
        </section>

        {/* FEEDBACK */}
        {currentFeedback && (
          <section ref={feedbackRef} style={{ ...cardStyle, borderColor: "#D4C7A8" }} className="mit-fade-in a2-card-pad">
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
              <ScoreRing score={currentFeedback.totalScore} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 500, color: "#1F1B16", lineHeight: 1.45 }}>
                  {currentFeedback.encouragement}
                </div>
                <div style={{ fontSize: 12.5, color: "#6B5D54", marginTop: 4 }}>
                  Attempt {attempts.length}. Best so far: {sessionBest}/{MAX_SCORE}.
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              {Object.keys(CATEGORY_MAX).map(key => (
                <CategoryBar key={key} label={CATEGORY_LABELS[key]} score={currentFeedback.scores[key] || 0} max={CATEGORY_MAX[key]} />
              ))}
            </div>

            {currentFeedback.deductions.length > 0 && (
              <div style={{
                padding: "12px 14px", background: "#F8E5DC", border: "1px solid #E0B8A0",
                borderRadius: 10, marginBottom: 14
              }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#7A3818", fontWeight: 700, marginBottom: 6 }}>
                  ➖ Deductions ({currentFeedback.deductions.length})
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                  {currentFeedback.deductions.map((d, i) => (
                    <li key={i} style={{ fontSize: 13, color: "#1F1B16", lineHeight: 1.5 }}>−1 · {d.reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {currentFeedback.strengths.length > 0 && (
              <div style={{
                padding: "12px 14px", background: "#E8EFE9", border: "1px solid #B5C9B8",
                borderRadius: 10, marginBottom: 14
              }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#2D5043", fontWeight: 700, marginBottom: 6 }}>
                  ✅ Strengths
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                  {currentFeedback.strengths.map((s, i) => (
                    <li key={i} style={{ fontSize: 13, color: "#1F1B16", lineHeight: 1.5 }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {generalIssues.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6B5D54", fontWeight: 700, marginBottom: 8 }}>
                  🔍 Whole-essay notes
                </div>
                {generalIssues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
              </div>
            )}

            {PARAGRAPHS.some(p => issuesFor(p.category).length > 0) && (
              <div style={{ fontSize: 12.5, color: "#6B5D54", marginBottom: 14 }}>
                📝 Paragraph notes are shown above each paragraph.
              </div>
            )}

            {currentFeedback.sampleEssay && (
              <div style={{
                padding: "13px 15px", background: "#EEF3EE", border: "1px solid #B5C9B8",
                borderRadius: 10, marginBottom: 14
              }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#2D5043", fontWeight: 700, marginBottom: 8 }}>
                  ✨ One way to write this essay
                </div>
                {currentFeedback.sampleEssay.split(/\n\s*\n/).map((para, i) => (
                  <p key={i} style={{ fontSize: 13.5, color: "#1F1B16", lineHeight: 1.65, fontStyle: "italic", margin: "0 0 10px" }}>
                    <strong style={{ fontStyle: "normal", color: "#2D5043" }}>Paragraph {i + 1}. </strong>{para}
                  </p>
                ))}
                <div style={{ fontSize: 12, color: "#5A4D43" }}>This is one example. There are many other good ways to write it.</div>
              </div>
            )}

            <RetryNudge feedback={currentFeedback} />
          </section>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const pageWrap = {
  minHeight: "100vh",
  background: "#FAF6ED",
  padding: "28px 16px 60px",
  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  color: "#1F1B16"
};

const welcomeH = {
  fontFamily: "'Fraunces', serif",
  fontSize: 21,
  fontWeight: 500,
  color: "#1F1B16",
  margin: "0 0 12px 0"
};

const sectionH = {
  fontFamily: "'Fraunces', serif",
  fontSize: 19,
  fontWeight: 500,
  color: "#1F1B16",
  margin: "0 0 10px 0"
};

const chartTitle = {
  fontFamily: "'Fraunces', serif",
  fontSize: 16,
  fontWeight: 500,
  color: "#1F1B16",
  marginBottom: 4
};

const kickerStyle = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "#6B5D54",
  fontWeight: 700,
  margin: "0 0 6px"
};

function TopBar({ onBack, student, teacher }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 14, paddingLeft: 4 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#6B5D54", padding: 0 }}>
          ← Back to menu
        </button>
      )}
      {student && student.trim() && (
        <span style={{ fontSize: 13, color: "#6B5D54" }}>
          👤 <strong style={{ color: "#1F1B16" }}>{student}</strong>
          {teacher && <> · 📚 <strong style={{ color: "#1F1B16" }}>{teacher}</strong></>}
        </span>
      )}
    </div>
  );
}

function Title() {
  return (
    <header style={{ marginBottom: 20, paddingLeft: 4 }}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 500, margin: 0, letterSpacing: "-0.02em", color: "#1F1B16" }}>
        Business Writing Tutor
      </h1>
      <p style={{ fontSize: 14.5, color: "#6B5D54", margin: "6px 0 0 0", lineHeight: 1.5, maxWidth: 620 }}>
        PepsiCo (NASDAQ: PEP). Read the text, study the data, do the warm-up, then write a three-paragraph essay
        responding to the investment analysts' recommendation.
      </p>
    </header>
  );
}

function RetryNudge({ feedback }) {
  const score = feedback.totalScore;
  let headline, body;
  if (score >= MAX_SCORE) {
    headline = "🎉 Full marks — excellent work!";
    body = "You can stop here, or try a different argument for extra practice.";
  } else if (score >= 15) {
    headline = "So close! One more pass.";
    body = "Read the hints above each paragraph, edit in place, then submit again.";
  } else if (score >= 10) {
    headline = `Good progress! Focus on ${weakestCategoryLabel(feedback)}.`;
    body = "Work through the hints one by one, then submit again.";
  } else {
    headline = "Keep going! Use the reference cards and try again.";
    body = "Open the Key facts, Connector bank and Trends bank cards, rebuild the weak paragraphs, then submit again.";
  }
  return (
    <div style={{ padding: "13px 15px", background: "#F4EEDC", border: "1px solid #D4C7A8", borderRadius: 10 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 500, color: "#1F1B16", lineHeight: 1.4, marginBottom: 4 }}>
        {headline}
      </div>
      <div style={{ fontSize: 13, color: "#5A4D43", lineHeight: 1.55 }}>{body}</div>
      <div style={{ fontSize: 12.5, color: "#7A6B60", marginTop: 6 }}>
        Your paragraphs stay exactly as you left them — edit and submit as many times as you like.
      </div>
    </div>
  );
}
