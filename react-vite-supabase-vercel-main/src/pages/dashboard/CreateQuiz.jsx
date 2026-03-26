/**
 * CreateQuiz.jsx — Quizzp
 * Drop into: src/pages/CreateQuiz.jsx
 *
 * 1. Add to your frontend .env:
 *      VITE_SUPABASE_URL=https://xxxx.supabase.co
 *      VITE_SUPABASE_ANON_KEY=your-anon-key
 *      VITE_OPENAI_API_KEY=sk-your-key
 *
 * 2. Create src/lib/supabase.js:
 *      import { createClient } from '@supabase/supabase-js'
 *      export const supabase = createClient(
 *        import.meta.env.VITE_SUPABASE_URL,
 *        import.meta.env.VITE_SUPABASE_ANON_KEY
 *      )
 *
 * 3. Run in Supabase SQL editor:
 *      create table quizzes (
 *        id uuid default gen_random_uuid() primary key,
 *        user_id uuid references auth.users not null,
 *        title text not null,
 *        source text not null,
 *        questions jsonb not null,
 *        created_at timestamp with time zone default now()
 *      );
 *
 * 4. Add route in your router:
 *      <Route path="/create-quiz" element={<CreateQuiz />} />
 *
 * 5. Wire up dashboard card:
 *      onClick={() => navigate('/create-quiz')}
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// MUI imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';

// ── Clients ───────────────────────────────────────────────────────────────────
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
});

// ── Data ──────────────────────────────────────────────────────────────────────
const OPEN_TRIVIA_CATEGORIES = [
    { id: 'any', label: 'Any Category' },
    { id: 9,  label: 'General Knowledge' },
    { id: 23, label: 'History' },
    { id: 22, label: 'Geography' },
    { id: 17, label: 'Science & Nature' },
    { id: 18, label: 'Science: Computers' },
    { id: 21, label: 'Sports' },
    { id: 25, label: 'Art' },
    { id: 27, label: 'Animals' },
    { id: 11, label: 'Film' },
    { id: 12, label: 'Music' },
    { id: 15, label: 'Video Games' },
];

const TRIVIA_API_CATEGORIES = [
    { id: 'any',                  label: 'Any Category' },
    { id: 'music',                label: 'Music' },
    { id: 'sport_and_leisure',    label: 'Sport & Leisure' },
    { id: 'film_and_tv',          label: 'Film & TV' },
    { id: 'arts_and_literature',  label: 'Arts & Literature' },
    { id: 'history',              label: 'History' },
    { id: 'society_and_culture',  label: 'Society & Culture' },
    { id: 'science',              label: 'Science' },
    { id: 'geography',            label: 'Geography' },
    { id: 'food_and_drink',       label: 'Food & Drink' },
    { id: 'general_knowledge',    label: 'General Knowledge' },
];

const SOURCES = [
    {
        id: 'opentrivia',
        label: 'Open Trivia DB',
        icon: '🎲',
        description: 'Free · 4,000+ questions · True/False & MCQ · 24 categories',
        supportsTypes: ['boolean', 'multiple', 'any'],
        supportsCategories: true,
        maxQuestions: 50,
    },
    {
        id: 'triviaapi',
        label: 'The Trivia API',
        icon: '📚',
        description: 'Free · Modern categories · Multiple choice only',
        supportsTypes: ['multiple'],
        supportsCategories: true,
        maxQuestions: 30,
    },
    {
        id: 'openai',
        label: 'AI Generated',
        icon: '🤖',
        description: 'OpenAI GPT · Any topic · True/False & MCQ · Unlimited',
        supportsTypes: ['boolean', 'multiple'],
        supportsCategories: false,
        maxQuestions: 20,
    },
];

// ── API Fetchers ──────────────────────────────────────────────────────────────
function decodeHtml(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

async function fetchOpenTrivia({ category, difficulty, type, amount }) {
    const cat  = category !== 'any' ? `&category=${category}` : '';
    const diff = difficulty !== 'any' ? `&difficulty=${difficulty}` : '';
    const typ  = type !== 'any' ? `&type=${type}` : '';
    const url  = `https://opentdb.com/api.php?amount=${amount}${cat}${diff}${typ}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.response_code !== 0) {
        throw new Error('Not enough questions for those filters. Try changing the category or difficulty.');
    }
    return data.results.map((q) => ({
        question: decodeHtml(q.question),
        correct_answer: decodeHtml(q.correct_answer),
        incorrect_answers: q.incorrect_answers.map(decodeHtml),
        type: q.type,
        difficulty: q.difficulty,
        category: decodeHtml(q.category),
        source: 'Open Trivia DB',
    }));
}

async function fetchTriviaAPI({ category, difficulty, amount }) {
    const cat  = category !== 'any' ? `&categories=${category}` : '';
    const diff = difficulty !== 'any' ? `&difficulty=${difficulty}` : '';
    const url  = `https://the-trivia-api.com/v2/questions?limit=${amount}${cat}${diff}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No questions returned. Try different filters.');
    }
    return data.map((q) => ({
        question: q.question.text,
        correct_answer: q.correctAnswer,
        incorrect_answers: q.incorrectAnswers,
        type: 'multiple',
        difficulty: q.difficulty,
        category: q.category,
        source: 'The Trivia API',
    }));
}

async function fetchOpenAI({ topic, difficulty, type, amount }) {
    const formatNote = type === 'boolean'
        ? `True/False statements. correct_answer must be "True" or "False". incorrect_answers must have exactly one item (the opposite).`
        : `Multiple choice with 4 options. correct_answer is correct. incorrect_answers has exactly 3 wrong options.`;

    const prompt = `Generate exactly ${amount} pub quiz questions about "${topic}" at ${difficulty} difficulty.
Format: ${formatNote}
Respond ONLY with a JSON array. Each object must have:
"question", "correct_answer", "incorrect_answers" (array), "type" ("${type === 'boolean' ? 'boolean' : 'multiple'}"), "difficulty", "category"
No markdown, no explanation, just the JSON array.`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
    });

    const raw   = completion.choices[0].message.content.trim();
    const clean = raw.replace(/```json|```/g, '').trim();
    const qs    = JSON.parse(clean);
    return qs.map((q) => ({ ...q, source: 'OpenAI' }));
}

// ── Component ─────────────────────────────────────────────────────────────────
function CreateQuiz() {
    const navigate = useNavigate();

    const [step,     setStep]     = useState(1);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');

    const [source,       setSource]       = useState('opentrivia');
    const [topic,        setTopic]        = useState('');
    const [category,     setCategory]     = useState('any');
    const [difficulty,   setDifficulty]   = useState('medium');
    const [questionType, setQuestionType] = useState('boolean');
    const [amount,       setAmount]       = useState(10);

    const [questions, setQuestions] = useState([]);
    const [accepted,  setAccepted]  = useState({});
    const [quizTitle, setQuizTitle] = useState('');
    const [savedMsg,  setSavedMsg]  = useState('');

    const currentSource = SOURCES.find((s) => s.id === source);
    const acceptedCount = Object.values(accepted).filter(Boolean).length;

    function handleSourceChange(newSource) {
        const src = SOURCES.find((s) => s.id === newSource);
        setSource(newSource);
        setCategory('any');
        setQuestionType(src.supportsTypes[0]);
    }

    async function handleGenerate() {
        setError('');
        if (source === 'openai' && !topic.trim()) {
            setError('Please enter a topic for AI generation.');
            return;
        }
        setLoading(true);
        try {
            let qs;
            if (source === 'opentrivia') {
                qs = await fetchOpenTrivia({ category, difficulty, type: questionType, amount });
            } else if (source === 'triviaapi') {
                qs = await fetchTriviaAPI({ category, difficulty, amount });
            } else {
                qs = await fetchOpenAI({ topic: topic.trim(), difficulty, type: questionType, amount });
            }
            setQuestions(qs);
            const acc = {};
            qs.forEach((_, i) => (acc[i] = true));
            setAccepted(acc);
            if (source === 'openai') {
                setQuizTitle(topic.trim());
            } else if (source === 'opentrivia') {
                const cat = OPEN_TRIVIA_CATEGORIES.find((c) => String(c.id) === String(category));
                setQuizTitle(cat?.label || 'My Quiz');
            } else {
                const cat = TRIVIA_API_CATEGORIES.find((c) => c.id === category);
                setQuizTitle(cat?.label || 'My Quiz');
            }
            setStep(2);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function toggleAccepted(i) { setAccepted((p) => ({ ...p, [i]: !p[i] })); }
    function acceptAll() { const a = {}; questions.forEach((_, i) => (a[i] = true));  setAccepted(a); }
    function rejectAll() { const a = {}; questions.forEach((_, i) => (a[i] = false)); setAccepted(a); }

    async function handleSave() {
        setError('');
        const finalQs = questions.filter((_, i) => accepted[i]);
        if (finalQs.length === 0) { setError('Please accept at least one question before saving.'); return; }
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error: dbErr } = await supabase.from('quizzes').insert({
                user_id: user.id, title: quizTitle || 'Untitled Quiz',
                source: currentSource.label, questions: finalQs,
            });
            if (dbErr) throw new Error(dbErr.message);
            setSavedMsg(`Saved "${quizTitle}" with ${finalQs.length} questions!`);
            setStep(3);
        } catch (err) {
            setError(err.message || 'Failed to save. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function handleReset() {
        setStep(1); setQuestions([]); setTopic(''); setError('');
        setSavedMsg(''); setQuizTitle(''); setSource('opentrivia');
        setCategory('any'); setDifficulty('medium');
        setQuestionType('boolean'); setAmount(10);
    }

    // Shared gradient background — matches your existing pages exactly
    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 15%, #e1bee7 45%, #ce93d8 70%, #ab47bc 100%)',
            py: 8,
        }}>
            <Container maxWidth="md">

                <Button onClick={() => navigate('/dashboard')} sx={{ color: '#7c3aed', mb: 3, fontWeight: 600 }}>
                    ← Back to Dashboard
                </Button>

                <Typography variant="h4" fontWeight={700} sx={{ color: '#2e1065', mb: 1 }}>
                    🎯 Create Quiz
                </Typography>
                <Typography variant="body1" sx={{ color: '#6b21a8', mb: 4 }}>
                    {step === 1 && 'Choose a question source, set your filters, and generate instantly.'}
                    {step === 2 && 'Review your questions — accept the ones you want to keep.'}
                    {step === 3 && 'Your quiz has been saved and is ready to use!'}
                </Typography>

                {/* Step indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
                    {['Configure', 'Review', 'Saved'].map((label, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                                width: 32, height: 32, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: 14,
                                bgcolor: step >= i + 1 ? '#7c3aed' : 'rgba(255,255,255,0.5)',
                                color: step >= i + 1 ? '#fff' : '#9ca3af',
                            }}>
                                {step > i + 1 ? '✓' : i + 1}
                            </Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: step === i + 1 ? '#2e1065' : '#9ca3af' }}>
                                {label}
                            </Typography>
                            {i < 2 && <Box sx={{ width: 32, height: 2, bgcolor: step > i + 1 ? '#7c3aed' : 'rgba(255,255,255,0.4)', mx: 0.5 }} />}
                        </Box>
                    ))}
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
                {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1, bgcolor: '#e9d5ff', '& .MuiLinearProgress-bar': { bgcolor: '#7c3aed' } }} />}

                {/* ── STEP 1 ── */}
                {step === 1 && (
                    <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(124,58,237,0.12)' }}>
                        <CardContent sx={{ p: 4 }}>

                            {/* Source cards */}
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2e1065', mb: 2 }}>
                                Question Source
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 4 }}>
                                {SOURCES.map((src) => (
                                    <Grid item xs={12} sm={4} key={src.id}>
                                        <Card onClick={() => handleSourceChange(src.id)} sx={{
                                            cursor: 'pointer',
                                            border: source === src.id ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                                            bgcolor: source === src.id ? '#faf5ff' : '#fff',
                                            borderRadius: 3,
                                            transition: 'all 0.2s',
                                            '&:hover': { borderColor: '#7c3aed', bgcolor: '#faf5ff' },
                                        }}>
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Typography fontSize={28} mb={0.5}>{src.icon}</Typography>
                                                <Typography fontWeight={700} fontSize={14} color="#2e1065">{src.label}</Typography>
                                                <Typography fontSize={11} color="#6b7280" mt={0.5} lineHeight={1.4}>{src.description}</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Topic (OpenAI only) */}
                            {source === 'openai' && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2e1065', mb: 1 }}>Topic *</Typography>
                                    <TextField
                                        fullWidth
                                        placeholder='e.g. "World War 2", "Premier League Football", "The Solar System"'
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&.Mui-focused fieldset': { borderColor: '#7c3aed' } } }}
                                    />
                                </Box>
                            )}

                            {/* Category */}
                            {currentSource.supportsCategories && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2e1065', mb: 1 }}>Category</Typography>
                                    <FormControl fullWidth>
                                        <Select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            sx={{ borderRadius: 2, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7c3aed' } }}
                                        >
                                            {(source === 'opentrivia' ? OPEN_TRIVIA_CATEGORIES : TRIVIA_API_CATEGORIES).map((c) => (
                                                <MenuItem key={c.id} value={String(c.id)}>{c.label}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}

                            {/* Question format */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2e1065', mb: 1 }}>Question Format</Typography>
                                <ToggleButtonGroup value={questionType} exclusive onChange={(_, val) => val && setQuestionType(val)} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                    {currentSource.supportsTypes.map((t) => (
                                        <ToggleButton key={t} value={t} sx={{
                                            borderRadius: '8px !important', border: '2px solid #e5e7eb !important',
                                            fontWeight: 600, px: 3,
                                            '&.Mui-selected': { bgcolor: '#faf5ff !important', borderColor: '#7c3aed !important', color: '#7c3aed' },
                                        }}>
                                            {t === 'boolean' ? '✓/✗ True / False' : t === 'multiple' ? '⊙ Multiple Choice' : '☰ Mixed'}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                            </Box>

                            {/* Difficulty */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2e1065', mb: 1 }}>Difficulty</Typography>
                                <ToggleButtonGroup value={difficulty} exclusive onChange={(_, val) => val && setDifficulty(val)} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                    {[
                                        { value: 'easy',   label: '😊 Easy',   color: '#16a34a' },
                                        { value: 'medium', label: '🤔 Medium', color: '#d97706' },
                                        { value: 'hard',   label: '🔥 Hard',   color: '#dc2626' },
                                        ...(source !== 'openai' ? [{ value: 'any', label: '🎲 Any', color: '#7c3aed' }] : []),
                                    ].map((opt) => (
                                        <ToggleButton key={opt.value} value={opt.value} sx={{
                                            borderRadius: '8px !important', border: '2px solid #e5e7eb !important',
                                            fontWeight: 600, px: 3,
                                            '&.Mui-selected': { bgcolor: '#faf5ff !important', borderColor: `${opt.color} !important`, color: opt.color },
                                        }}>
                                            {opt.label}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                            </Box>

                            {/* Amount slider */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2e1065', mb: 2 }}>
                                    Number of Questions — <Box component="span" sx={{ color: '#7c3aed' }}>{amount}</Box>
                                </Typography>
                                <Slider
                                    value={amount} min={5} max={currentSource.maxQuestions} step={5} marks
                                    onChange={(_, val) => setAmount(val)}
                                    sx={{ color: '#7c3aed', '& .MuiSlider-mark': { bgcolor: '#c4b5fd' } }}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography fontSize={12} color="#9ca3af">5</Typography>
                                    <Typography fontSize={12} color="#9ca3af">{currentSource.maxQuestions}</Typography>
                                </Box>
                            </Box>

                            <Button fullWidth variant="contained" size="large" onClick={handleGenerate} disabled={loading} sx={{
                                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                borderRadius: 3, py: 1.8, fontWeight: 700, fontSize: 16,
                                boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
                                '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #9333ea)' },
                            }}>
                                {loading ? <><CircularProgress size={20} sx={{ color: '#fff', mr: 1 }} />Generating...</> : '✨ Generate Questions'}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* ── STEP 2 ── */}
                {step === 2 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                            <Typography fontWeight={600} color="#2e1065">
                                <Box component="span" sx={{ color: '#7c3aed', fontWeight: 800 }}>{acceptedCount}</Box> of {questions.length} accepted
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button size="small" onClick={acceptAll} sx={{ color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 2 }}>Accept All</Button>
                                <Button size="small" onClick={rejectAll} sx={{ color: '#dc2626', border: '1px solid #fecaca', borderRadius: 2 }}>Reject All</Button>
                                <Button size="small" onClick={() => setStep(1)} sx={{ color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 2 }}>← Back</Button>
                            </Box>
                        </Box>

                        {/* Title input */}
                        <Card sx={{ borderRadius: 3, mb: 2, boxShadow: '0 2px 12px rgba(124,58,237,0.08)' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography fontWeight={700} color="#2e1065" mb={1} fontSize={14}>Quiz Title</Typography>
                                <TextField fullWidth size="small" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)}
                                           placeholder="Enter a title for this quiz"
                                           sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&.Mui-focused fieldset': { borderColor: '#7c3aed' } } }}
                                />
                            </CardContent>
                        </Card>

                        {/* Question cards */}
                        {questions.map((q, i) => (
                            <Card key={i} sx={{
                                borderRadius: 3, mb: 2,
                                borderLeft: accepted[i] ? '4px solid #7c3aed' : '4px solid #e5e7eb',
                                opacity: accepted[i] ? 1 : 0.5,
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                                        <Typography fontWeight={800} color="#7c3aed" fontSize={14} minWidth={28}>Q{i + 1}</Typography>
                                        <Chip label={q.source} size="small" sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 600, fontSize: 11 }} />
                                        <Chip label={q.difficulty} size="small" sx={{ bgcolor: '#f3f4f6', color: '#374151', fontSize: 11 }} />
                                        <Chip label={q.type === 'boolean' ? 'True/False' : 'Multiple Choice'} size="small" sx={{ bgcolor: '#f3f4f6', color: '#374151', fontSize: 11 }} />
                                        <Box sx={{ flex: 1 }} />
                                        <Button size="small" onClick={() => toggleAccepted(i)} sx={{
                                            borderRadius: 2, fontWeight: 600, fontSize: 12, px: 1.5,
                                            bgcolor: accepted[i] ? '#d1fae5' : '#fee2e2',
                                            color: accepted[i] ? '#065f46' : '#991b1b',
                                            '&:hover': { bgcolor: accepted[i] ? '#a7f3d0' : '#fecaca' },
                                        }}>
                                            {accepted[i] ? '✓ Accepted' : '✗ Rejected'}
                                        </Button>
                                    </Box>
                                    <Typography fontWeight={500} color="#1f2937" mb={1.5} lineHeight={1.5}>{q.question}</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Chip label={`✓ ${q.correct_answer}`} sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 500 }} />
                                        {q.incorrect_answers?.map((ans, j) => (
                                            <Chip key={j} label={`✗ ${ans}`} sx={{ bgcolor: '#f3f4f6', color: '#6b7280' }} />
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}

                        <Button fullWidth variant="contained" size="large" onClick={handleSave} disabled={loading || acceptedCount === 0} sx={{
                            mt: 1, background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            borderRadius: 3, py: 1.8, fontWeight: 700, fontSize: 16,
                            boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
                            '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #9333ea)' },
                        }}>
                            {loading ? <><CircularProgress size={20} sx={{ color: '#fff', mr: 1 }} />Saving...</> : `💾 Save Quiz (${acceptedCount} questions)`}
                        </Button>
                    </Box>
                )}

                {/* ── STEP 3 ── */}
                {step === 3 && (
                    <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(124,58,237,0.12)', textAlign: 'center' }}>
                        <CardContent sx={{ p: 6 }}>
                            <Typography fontSize={64} mb={2}>🎉</Typography>
                            <Typography variant="h5" fontWeight={800} color="#2e1065" mb={1}>Quiz Saved!</Typography>
                            <Typography color="#6b21a8" mb={1}>{savedMsg}</Typography>
                            <Typography color="#9ca3af" fontSize={14} mb={4}>Source: {currentSource.label}</Typography>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Button variant="contained" onClick={handleReset} sx={{
                                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                    borderRadius: 3, fontWeight: 700, px: 4,
                                    boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
                                }}>
                                    + Create Another
                                </Button>
                                <Button variant="outlined" onClick={() => navigate('/my-quizzes')} sx={{
                                    borderColor: '#7c3aed', color: '#7c3aed', borderRadius: 3, fontWeight: 700, px: 4,
                                }}>
                                    View My Quizzes
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                )}

            </Container>
        </Box>
    );
}

export default CreateQuiz;