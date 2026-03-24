/**
 * CreateQuiz.jsx — Quizzp
 *
 * Drop this file into your React project src/pages/ or src/components/
 *
 * Dependencies to install:
 *   npm install openai @supabase/supabase-js
 *
 * Environment variables needed in your .env file:
 *   REACT_APP_OPENAI_API_KEY=sk-...
 *   REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
 *   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
 *
 * Supabase table needed (run this SQL in your Supabase dashboard):
 *   create table quizzes (
 *     id uuid default gen_random_uuid() primary key,
 *     user_id uuid references auth.users not null,
 *     title text not null,
 *     source text not null,
 *     questions jsonb not null,
 *     created_at timestamp with time zone default now()
 *   );
 */

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ── Supabase & OpenAI clients ─────────────────────────────────────────────────
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true, // fine for student projects; use a backend proxy in production
});

// ── Open Trivia DB category map ───────────────────────────────────────────────
const TRIVIA_CATEGORIES = [
    { id: 9,  label: "General Knowledge" },
    { id: 23, label: "History" },
    { id: 25, label: "Art" },
    { id: 27, label: "Animals" },
    { id: 17, label: "Science & Nature" },
    { id: 18, label: "Science: Computers" },
    { id: 21, label: "Sports" },
    { id: 22, label: "Geography" },
    { id: 11, label: "Entertainment: Film" },
    { id: 12, label: "Entertainment: Music" },
    { id: 15, label: "Entertainment: Video Games" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function decodeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

// ── API Fetchers ──────────────────────────────────────────────────────────────

/** Fetch from Open Trivia DB */
async function fetchFromOpenTrivia({ category, difficulty, type, amount }) {
    const catParam = category !== "any" ? `&category=${category}` : "";
    const diffParam = difficulty !== "any" ? `&difficulty=${difficulty}` : "";
    const typeParam = type !== "any" ? `&type=${type}` : "";
    const url = `https://opentdb.com/api.php?amount=${amount}${catParam}${diffParam}${typeParam}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.response_code !== 0) {
        throw new Error("Not enough questions available for those filters. Try relaxing the difficulty or category.");
    }

    return data.results.map((q) => ({
        question: decodeHtml(q.question),
        correct_answer: decodeHtml(q.correct_answer),
        incorrect_answers: q.incorrect_answers.map(decodeHtml),
        type: q.type,
        difficulty: q.difficulty,
        category: q.category,
        source: "Open Trivia DB",
    }));
}

/** Generate via OpenAI */
async function fetchFromOpenAI({ topic, difficulty, type, amount }) {
    const formatInstruction =
        type === "boolean"
            ? `Each question must be a True/False statement. The "correct_answer" field must be exactly "True" or "False". The "incorrect_answers" array must contain exactly one item which is the opposite answer.`
            : `Each question must be multiple choice with exactly 4 options. The "correct_answer" field is the correct option. The "incorrect_answers" array must contain exactly 3 wrong options.`;

    const prompt = `You are a pub quiz question generator. Generate exactly ${amount} quiz questions about "${topic}" at ${difficulty} difficulty.

${formatInstruction}

Respond ONLY with a valid JSON array, no markdown, no explanation. Each item must have these exact fields:
- "question": string
- "correct_answer": string  
- "incorrect_answers": array of strings
- "type": "${type === "boolean" ? "boolean" : "multiple"}"
- "difficulty": "${difficulty}"
- "category": "${topic}"

Example for True/False:
[{"question":"The Eiffel Tower is in Paris.","correct_answer":"True","incorrect_answers":["False"],"type":"boolean","difficulty":"easy","category":"Geography"}]`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
    });

    const raw = completion.choices[0].message.content.trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(clean);

    return questions.map((q) => ({ ...q, source: "OpenAI" }));
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CreateQuiz() {
    // Step 1 = config, Step 2 = review, Step 3 = saved
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [saveMsg, setSaveMsg] = useState("");

    // Form state
    const [topic, setTopic] = useState("");
    const [source, setSource] = useState("opentrivia"); // "opentrivia" | "openai"
    const [category, setCategory] = useState("9");
    const [difficulty, setDifficulty] = useState("medium");
    const [questionType, setQuestionType] = useState("boolean");
    const [amount, setAmount] = useState(10);
    const [quizTitle, setQuizTitle] = useState("");

    // Generated questions + accept/reject state
    const [questions, setQuestions] = useState([]);
    const [accepted, setAccepted] = useState({});

    // ── Generate ────────────────────────────────────────────────────────────────
    async function handleGenerate() {
        setError("");
        if (source === "openai" && !topic.trim()) {
            setError("Please enter a topic for AI generation.");
            return;
        }
        setLoading(true);
        try {
            let qs;
            if (source === "opentrivia") {
                qs = await fetchFromOpenTrivia({
                    category,
                    difficulty,
                    type: questionType,
                    amount,
                });
            } else {
                qs = await fetchFromOpenAI({
                    topic: topic.trim(),
                    difficulty,
                    type: questionType,
                    amount,
                });
            }
            setQuestions(qs);
            // Default all to accepted
            const acc = {};
            qs.forEach((_, i) => (acc[i] = true));
            setAccepted(acc);
            setQuizTitle(
                source === "openai"
                    ? topic.trim()
                    : TRIVIA_CATEGORIES.find((c) => c.id === parseInt(category))?.label || "My Quiz"
            );
            setStep(2);
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    // ── Toggle accept/reject ─────────────────────────────────────────────────
    function toggleAccepted(i) {
        setAccepted((prev) => ({ ...prev, [i]: !prev[i] }));
    }

    function acceptAll() {
        const acc = {};
        questions.forEach((_, i) => (acc[i] = true));
        setAccepted(acc);
    }

    function rejectAll() {
        const acc = {};
        questions.forEach((_, i) => (acc[i] = false));
        setAccepted(acc);
    }

    const acceptedCount = Object.values(accepted).filter(Boolean).length;

    // ── Save to Supabase ─────────────────────────────────────────────────────
    async function handleSave() {
        setSaveMsg("");
        setError("");
        const finalQuestions = questions.filter((_, i) => accepted[i]);
        if (finalQuestions.length === 0) {
            setError("Please accept at least one question before saving.");
            return;
        }
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error: dbError } = await supabase.from("quizzes").insert({
                user_id: user.id,
                title: quizTitle || "Untitled Quiz",
                source: source === "openai" ? "OpenAI" : "Open Trivia DB",
                questions: finalQuestions,
            });
            if (dbError) throw new Error(dbError.message);
            setSaveMsg(`✓ Quiz saved with ${finalQuestions.length} questions!`);
            setStep(3);
        } catch (err) {
            setError(err.message || "Failed to save. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={styles.page}>
            <div style={styles.container}>

                {/* ── Header ── */}
                <div style={styles.header}>
                    <h1 style={styles.title}>Create Quiz</h1>
                    <p style={styles.subtitle}>
                        {step === 1 && "Configure your quiz settings and generate questions instantly."}
                        {step === 2 && "Review your questions. Accept the ones you want to keep."}
                        {step === 3 && "Your quiz has been saved to My Quizzes!"}
                    </p>
                    {/* Step indicator */}
                    <div style={styles.steps}>
                        {["Configure", "Review", "Saved"].map((label, i) => (
                            <div key={i} style={styles.stepItem}>
                                <div style={{
                                    ...styles.stepDot,
                                    background: step > i + 1 ? "#7c3aed" : step === i + 1 ? "#7c3aed" : "#e5e7eb",
                                    color: step >= i + 1 ? "#fff" : "#9ca3af",
                                }}>
                                    {step > i + 1 ? "✓" : i + 1}
                                </div>
                                <span style={{ ...styles.stepLabel, color: step === i + 1 ? "#7c3aed" : "#9ca3af" }}>
                  {label}
                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Error banner ── */}
                {error && (
                    <div style={styles.errorBanner}>⚠ {error}</div>
                )}

                {/* ════════════════════════════════════════════════
            STEP 1 — Configure
        ════════════════════════════════════════════════ */}
                {step === 1 && (
                    <div style={styles.card}>

                        {/* Source selector */}
                        <div style={styles.field}>
                            <label style={styles.label}>Question Source</label>
                            <div style={styles.sourceGrid}>
                                <button
                                    style={{ ...styles.sourceBtn, ...(source === "opentrivia" ? styles.sourceBtnActive : {}) }}
                                    onClick={() => setSource("opentrivia")}
                                >
                                    <span style={styles.sourceBtnIcon}>🎲</span>
                                    <strong>Open Trivia DB</strong>
                                    <span style={styles.sourceBtnSub}>Free · 4,000+ questions · True/False & MCQ</span>
                                </button>
                                <button
                                    style={{ ...styles.sourceBtn, ...(source === "openai" ? styles.sourceBtnActive : {}) }}
                                    onClick={() => setSource("openai")}
                                >
                                    <span style={styles.sourceBtnIcon}>🤖</span>
                                    <strong>AI Generated (OpenAI)</strong>
                                    <span style={styles.sourceBtnSub}>Any topic · Unlimited · GPT-powered</span>
                                </button>
                            </div>
                        </div>

                        {/* Topic (OpenAI only) */}
                        {source === "openai" && (
                            <div style={styles.field}>
                                <label style={styles.label}>Topic *</label>
                                <input
                                    style={styles.input}
                                    type="text"
                                    placeholder='e.g. "World War 2", "Premier League Football", "The Solar System"'
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Category (Open Trivia only) */}
                        {source === "opentrivia" && (
                            <div style={styles.field}>
                                <label style={styles.label}>Category</label>
                                <select style={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
                                    <option value="any">Any Category</option>
                                    {TRIVIA_CATEGORIES.map((c) => (
                                        <option key={c.id} value={String(c.id)}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Question type */}
                        <div style={styles.field}>
                            <label style={styles.label}>Question Format</label>
                            <div style={styles.toggleGroup}>
                                {[
                                    { value: "boolean", label: "✓/✗ True / False" },
                                    { value: "multiple", label: "⊙ Multiple Choice" },
                                    ...(source === "opentrivia" ? [{ value: "any", label: "☰ Mixed" }] : []),
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        style={{
                                            ...styles.toggleBtn,
                                            ...(questionType === opt.value ? styles.toggleBtnActive : {}),
                                        }}
                                        onClick={() => setQuestionType(opt.value)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div style={styles.field}>
                            <label style={styles.label}>Difficulty</label>
                            <div style={styles.toggleGroup}>
                                {[
                                    { value: "easy",   label: "😊 Easy",   color: "#16a34a" },
                                    { value: "medium", label: "🤔 Medium", color: "#d97706" },
                                    { value: "hard",   label: "🔥 Hard",   color: "#dc2626" },
                                    ...(source === "opentrivia" ? [{ value: "any", label: "🎲 Any", color: "#7c3aed" }] : []),
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        style={{
                                            ...styles.toggleBtn,
                                            ...(difficulty === opt.value
                                                ? { ...styles.toggleBtnActive, borderColor: opt.color, color: opt.color }
                                                : {}),
                                        }}
                                        onClick={() => setDifficulty(opt.value)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Number of questions */}
                        <div style={styles.field}>
                            <label style={styles.label}>
                                Number of Questions — <span style={{ color: "#7c3aed", fontWeight: 700 }}>{amount}</span>
                            </label>
                            <input
                                type="range"
                                min={5}
                                max={source === "openai" ? 20 : 50}
                                step={5}
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                style={styles.slider}
                            />
                            <div style={styles.sliderLabels}>
                                <span>5</span>
                                <span>{source === "openai" ? 20 : 50}</span>
                            </div>
                        </div>

                        <button
                            style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }}
                            onClick={handleGenerate}
                            disabled={loading}
                        >
                            {loading ? "⏳ Generating questions..." : "✨ Generate Questions"}
                        </button>
                    </div>
                )}

                {/* ════════════════════════════════════════════════
            STEP 2 — Review Questions
        ════════════════════════════════════════════════ */}
                {step === 2 && (
                    <div>
                        {/* Controls bar */}
                        <div style={styles.reviewBar}>
              <span style={styles.reviewCount}>
                <strong style={{ color: "#7c3aed" }}>{acceptedCount}</strong> of {questions.length} accepted
              </span>
                            <div style={styles.reviewActions}>
                                <button style={styles.ghostBtn} onClick={acceptAll}>Accept All</button>
                                <button style={styles.ghostBtn} onClick={rejectAll}>Reject All</button>
                                <button style={styles.ghostBtn} onClick={() => setStep(1)}>← Back</button>
                            </div>
                        </div>

                        {/* Quiz title input */}
                        <div style={{ ...styles.card, marginBottom: 12, padding: "16px 24px" }}>
                            <label style={styles.label}>Quiz Title</label>
                            <input
                                style={styles.input}
                                type="text"
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                placeholder="Enter a title for this quiz"
                            />
                        </div>

                        {/* Question cards */}
                        {questions.map((q, i) => (
                            <div key={i} style={{
                                ...styles.questionCard,
                                opacity: accepted[i] ? 1 : 0.45,
                                borderLeft: accepted[i] ? "4px solid #7c3aed" : "4px solid #e5e7eb",
                            }}>
                                <div style={styles.questionHeader}>
                                    <span style={styles.questionNum}>Q{i + 1}</span>
                                    <div style={styles.questionMeta}>
                                        <span style={styles.badge}>{q.source}</span>
                                        <span style={{ ...styles.badge, background: "#f3f4f6", color: "#374151" }}>{q.difficulty}</span>
                                        <span style={{ ...styles.badge, background: "#f3f4f6", color: "#374151" }}>
                      {q.type === "boolean" ? "True/False" : "Multiple Choice"}
                    </span>
                                    </div>
                                    <button
                                        style={{ ...styles.acceptBtn, ...(accepted[i] ? styles.acceptBtnActive : styles.acceptBtnInactive) }}
                                        onClick={() => toggleAccepted(i)}
                                    >
                                        {accepted[i] ? "✓ Accepted" : "✗ Rejected"}
                                    </button>
                                </div>

                                <p style={styles.questionText}>{q.question}</p>

                                <div style={styles.answersGrid}>
                                    {/* Correct answer */}
                                    <div style={styles.answerCorrect}>
                                        ✓ {q.correct_answer}
                                    </div>
                                    {/* Wrong answers */}
                                    {q.incorrect_answers?.map((ans, j) => (
                                        <div key={j} style={styles.answerWrong}>✗ {ans}</div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Save button */}
                        <button
                            style={{ ...styles.primaryBtn, marginTop: 16, opacity: loading ? 0.7 : 1 }}
                            onClick={handleSave}
                            disabled={loading || acceptedCount === 0}
                        >
                            {loading ? "💾 Saving..." : `💾 Save Quiz (${acceptedCount} questions)`}
                        </button>
                    </div>
                )}

                {/* ════════════════════════════════════════════════
            STEP 3 — Saved
        ════════════════════════════════════════════════ */}
                {step === 3 && (
                    <div style={styles.card}>
                        <div style={styles.successBox}>
                            <div style={styles.successIcon}>🎉</div>
                            <h2 style={styles.successTitle}>{saveMsg}</h2>
                            <p style={styles.successSub}>
                                Your quiz <strong>"{quizTitle}"</strong> has been saved and is ready to use.
                            </p>
                            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
                                <button style={styles.primaryBtn} onClick={() => {
                                    setStep(1);
                                    setQuestions([]);
                                    setTopic("");
                                    setError("");
                                    setSaveMsg("");
                                }}>
                                    + Create Another Quiz
                                </button>
                                <a href="/dashboard" style={{ ...styles.primaryBtn, background: "#fff", color: "#7c3aed", border: "2px solid #7c3aed", textDecoration: "none" }}>
                                    Go to My Quizzes
                                </a>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
    page: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fce4ec 0%, #e1bee7 40%, #d1c4e9 100%)",
        padding: "40px 16px 80px",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    container: {
        maxWidth: 760,
        margin: "0 auto",
    },
    header: {
        textAlign: "center",
        marginBottom: 32,
    },
    title: {
        fontSize: 36,
        fontWeight: 800,
        color: "#1e1b4b",
        margin: "0 0 8px",
    },
    subtitle: {
        fontSize: 16,
        color: "#4b5563",
        margin: "0 0 24px",
    },
    steps: {
        display: "flex",
        justifyContent: "center",
        gap: 40,
        alignItems: "center",
    },
    stepItem: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
    },
    stepDot: {
        width: 36,
        height: 36,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 14,
        transition: "all 0.3s",
    },
    stepLabel: {
        fontSize: 12,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    card: {
        background: "#fff",
        borderRadius: 20,
        padding: "32px",
        boxShadow: "0 4px 24px rgba(124,58,237,0.08)",
        marginBottom: 16,
    },
    field: {
        marginBottom: 24,
    },
    label: {
        display: "block",
        fontSize: 14,
        fontWeight: 600,
        color: "#374151",
        marginBottom: 10,
    },
    input: {
        width: "100%",
        padding: "12px 16px",
        borderRadius: 10,
        border: "2px solid #e5e7eb",
        fontSize: 15,
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
    },
    select: {
        width: "100%",
        padding: "12px 16px",
        borderRadius: 10,
        border: "2px solid #e5e7eb",
        fontSize: 15,
        outline: "none",
        background: "#fff",
        cursor: "pointer",
        boxSizing: "border-box",
    },
    sourceGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
    },
    sourceBtn: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 4,
        padding: "16px 20px",
        borderRadius: 12,
        border: "2px solid #e5e7eb",
        background: "#fff",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s",
        fontSize: 14,
    },
    sourceBtnActive: {
        borderColor: "#7c3aed",
        background: "#faf5ff",
    },
    sourceBtnIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    sourceBtnSub: {
        fontSize: 12,
        color: "#6b7280",
        fontWeight: 400,
    },
    toggleGroup: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
    },
    toggleBtn: {
        padding: "10px 18px",
        borderRadius: 8,
        border: "2px solid #e5e7eb",
        background: "#fff",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500,
        color: "#6b7280",
        transition: "all 0.2s",
    },
    toggleBtnActive: {
        borderColor: "#7c3aed",
        background: "#faf5ff",
        color: "#7c3aed",
        fontWeight: 600,
    },
    slider: {
        width: "100%",
        accentColor: "#7c3aed",
        cursor: "pointer",
    },
    sliderLabels: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
        color: "#9ca3af",
        marginTop: 4,
    },
    primaryBtn: {
        display: "block",
        width: "100%",
        padding: "16px",
        borderRadius: 12,
        border: "none",
        background: "linear-gradient(135deg, #7c3aed, #a855f7)",
        color: "#fff",
        fontSize: 16,
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 4px 15px rgba(124,58,237,0.35)",
        transition: "transform 0.1s, box-shadow 0.1s",
        textAlign: "center",
    },
    errorBanner: {
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#b91c1c",
        borderRadius: 10,
        padding: "12px 16px",
        fontSize: 14,
        marginBottom: 16,
    },
    reviewBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        flexWrap: "wrap",
        gap: 8,
    },
    reviewCount: {
        fontSize: 15,
        color: "#374151",
    },
    reviewActions: {
        display: "flex",
        gap: 8,
    },
    ghostBtn: {
        padding: "8px 14px",
        borderRadius: 8,
        border: "1px solid #d1d5db",
        background: "#fff",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
        color: "#374151",
    },
    questionCard: {
        background: "#fff",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        transition: "opacity 0.2s",
    },
    questionHeader: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
        flexWrap: "wrap",
    },
    questionNum: {
        fontWeight: 700,
        color: "#7c3aed",
        fontSize: 14,
        minWidth: 28,
    },
    questionMeta: {
        display: "flex",
        gap: 6,
        flex: 1,
        flexWrap: "wrap",
    },
    badge: {
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        background: "#ede9fe",
        color: "#5b21b6",
    },
    acceptBtn: {
        padding: "6px 14px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        transition: "all 0.2s",
    },
    acceptBtnActive: {
        background: "#d1fae5",
        color: "#065f46",
    },
    acceptBtnInactive: {
        background: "#fee2e2",
        color: "#991b1b",
    },
    questionText: {
        fontSize: 15,
        color: "#1f2937",
        fontWeight: 500,
        margin: "0 0 14px",
        lineHeight: 1.5,
    },
    answersGrid: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
    },
    answerCorrect: {
        padding: "6px 14px",
        borderRadius: 8,
        background: "#d1fae5",
        color: "#065f46",
        fontSize: 13,
        fontWeight: 500,
    },
    answerWrong: {
        padding: "6px 14px",
        borderRadius: 8,
        background: "#f3f4f6",
        color: "#6b7280",
        fontSize: 13,
    },
    successBox: {
        textAlign: "center",
        padding: "24px 0",
    },
    successIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: 700,
        color: "#1e1b4b",
        margin: "0 0 8px",
    },
    successSub: {
        fontSize: 15,
        color: "#6b7280",
    },
};
