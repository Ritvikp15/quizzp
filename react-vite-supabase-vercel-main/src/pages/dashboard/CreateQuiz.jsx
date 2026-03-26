/**
 * CreateQuiz.jsx — Quizzp (Multi-Source)
 * Place at: src/pages/dashboard/CreateQuiz.jsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import supabase from '../../utils/supabase';
import OpenAI from 'openai';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
});

const SOURCE_COLOURS = {
    'Open Trivia DB': { bgcolor: '#dbeafe', color: '#1e40af' },
    'The Trivia API': { bgcolor: '#d1fae5', color: '#065f46' },
    'OpenAI':         { bgcolor: '#ede9fe', color: '#5b21b6' },
};

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
    { id: 'any',                 label: 'Any Category' },
    { id: 'music',               label: 'Music' },
    { id: 'sport_and_leisure',   label: 'Sport & Leisure' },
    { id: 'film_and_tv',         label: 'Film & TV' },
    { id: 'arts_and_literature', label: 'Arts & Literature' },
    { id: 'history',             label: 'History' },
    { id: 'society_and_culture', label: 'Society & Culture' },
    { id: 'science',             label: 'Science' },
    { id: 'geography',           label: 'Geography' },
    { id: 'food_and_drink',      label: 'Food & Drink' },
    { id: 'general_knowledge',   label: 'General Knowledge' },
];

const SOURCES = [
    { id: 'opentrivia', label: 'Open Trivia DB', icon: '🎲', description: 'Free · 4,000+ questions · True/False & MCQ' },
    { id: 'triviaapi',  label: 'The Trivia API',  icon: '📚', description: 'Free · Modern categories · Multiple choice' },
    { id: 'openai',     label: 'OpenAI',           icon: '🤖', description: 'GPT-powered · Any topic · True/False & MCQ' },
];

function decodeHtml(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

async function fetchOpenTrivia({ category, difficulty, type, amount }) {
    const cat  = category !== 'any' ? `&category=${category}` : '';
    const diff = difficulty !== 'any' ? `&difficulty=${difficulty}` : '';
    const typ  = type !== 'any' ? `&type=${type}` : '';
    const res  = await fetch(`https://opentdb.com/api.php?amount=${amount}${cat}${diff}${typ}`);
    const data = await res.json();
    if (data.response_code !== 0) throw new Error('Open Trivia DB: not enough questions for those filters.');
    return data.results.map((q) => ({
        question: decodeHtml(q.question),
        correct_answer: decodeHtml(q.correct_answer),
        incorrect_answers: q.incorrect_answers.map(decodeHtml),
        type: q.type, difficulty: q.difficulty,
        category: decodeHtml(q.category), source: 'Open Trivia DB',
    }));
}

async function fetchTriviaAPI({ category, difficulty, amount }) {
    const cat  = category !== 'any' ? `&categories=${category}` : '';
    const diff = difficulty !== 'any' ? `&difficulty=${difficulty}` : '';
    const res  = await fetch(`https://the-trivia-api.com/v2/questions?limit=${amount}${cat}${diff}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('The Trivia API: no questions returned.');
    return data.map((q) => ({
        question: q.question.text, correct_answer: q.correctAnswer,
        incorrect_answers: q.incorrectAnswers, type: 'multiple',
        difficulty: q.difficulty, category: q.category, source: 'The Trivia API',
    }));
}

async function fetchOpenAI({ topic, difficulty, type, amount }) {
    const fmt = type === 'boolean'
        ? `True/False. correct_answer = "True" or "False". incorrect_answers has 1 item.`
        : `MCQ. correct_answer is correct. incorrect_answers has 3 wrong options.`;
    const prompt = `Generate exactly ${amount} pub quiz questions about "${topic}" at ${difficulty} difficulty.
Format: ${fmt}
Respond ONLY with a JSON array. Fields: "question","correct_answer","incorrect_answers","type","difficulty","category". No markdown.`;
    const c = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
    });
    const clean = c.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    return JSON.parse(clean).map((q) => ({ ...q, source: 'OpenAI' }));
}

export default function CreateQuiz() {
    const navigate = useNavigate();

    const [step,    setStep]    = useState(1);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');

    const [selectedSources, setSelectedSources] = useState(['opentrivia']);
    const [difficulty,      setDifficulty]      = useState('medium');
    const [questionType,    setQuestionType]    = useState('boolean');
    const [amountPer,       setAmountPer]       = useState(5);
    const [otCategory,      setOtCategory]      = useState('any');
    const [taCategory,      setTaCategory]      = useState('any');
    const [aiTopic,         setAiTopic]         = useState('');

    const [questions, setQuestions] = useState([]);
    const [accepted,  setAccepted]  = useState({});
    const [quizTitle, setQuizTitle] = useState('');
    const [savedMsg,  setSavedMsg]  = useState('');

    const acceptedCount    = Object.values(accepted).filter(Boolean).length;
    const openaiSelected   = selectedSources.includes('openai');
    const triviaApiSelected = selectedSources.includes('triviaapi');

    function toggleSource(id) {
        setSelectedSources((prev) => {
            const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
            if (next.length === 0) return prev;
            if (next.includes('triviaapi')) setQuestionType('multiple');
            return next;
        });
    }

    async function handleGenerate() {
        setError('');
        if (openaiSelected && !aiTopic.trim()) { setError('Please enter a topic for AI generation.'); return; }
        if (selectedSources.length === 0) { setError('Please select at least one source.'); return; }
        setLoading(true);
        try {
            const promises = selectedSources.map((id) => {
                if (id === 'opentrivia') return fetchOpenTrivia({ category: otCategory, difficulty, type: questionType, amount: amountPer });
                if (id === 'triviaapi')  return fetchTriviaAPI({ category: taCategory, difficulty, amount: amountPer });
                if (id === 'openai')    return fetchOpenAI({ topic: aiTopic.trim(), difficulty, type: questionType, amount: amountPer });
                return Promise.resolve([]);
            });
            const results = await Promise.allSettled(promises);
            const allQs = []; const errors = [];
            results.forEach((r, i) => {
                if (r.status === 'fulfilled') allQs.push(...r.value);
                else errors.push(r.reason?.message || `${selectedSources[i]} failed`);
            });
            if (allQs.length === 0) throw new Error(errors.join(' | '));
            if (errors.length > 0) setError(`Some sources failed: ${errors.join(' | ')}`);
            const shuffled = allQs.sort(() => Math.random() - 0.5);
            setQuestions(shuffled);
            const acc = {}; shuffled.forEach((_, i) => (acc[i] = true)); setAccepted(acc);
            setQuizTitle(openaiSelected && aiTopic.trim() ? aiTopic.trim() : 'Mixed Quiz');
            setStep(2);
        } catch (err) {
            setError(err.message || 'Something went wrong.');
        } finally { setLoading(false); }
    }

    function toggleAccepted(i) { setAccepted((p) => ({ ...p, [i]: !p[i] })); }
    function acceptAll()  { const a = {}; questions.forEach((_, i) => (a[i] = true));  setAccepted(a); }
    function rejectAll()  { const a = {}; questions.forEach((_, i) => (a[i] = false)); setAccepted(a); }
    function acceptBySource(src) { const a = { ...accepted }; questions.forEach((q, i) => { if (q.source === src) a[i] = true;  }); setAccepted(a); }
    function rejectBySource(src) { const a = { ...accepted }; questions.forEach((q, i) => { if (q.source === src) a[i] = false; }); setAccepted(a); }

    async function handleSave() {
        setError('');
        const finalQs = questions.filter((_, i) => accepted[i]);
        if (finalQs.length === 0) { setError('Please accept at least one question.'); return; }
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const sourceLabel = [...new Set(finalQs.map((q) => q.source))].join(' + ');
            const { error: dbErr } = await supabase.from('quizzes').insert({
                user_id: user.id, title: quizTitle || 'Untitled Quiz',
                source: sourceLabel, questions: finalQs,
            });
            if (dbErr) throw new Error(dbErr.message);
            setSavedMsg(`Saved "${quizTitle}" with ${finalQs.length} questions!`);
            setStep(3);
        } catch (err) {
            setError(err.message || 'Failed to save.');
        } finally { setLoading(false); }
    }

    function handleReset() {
        setStep(1); setQuestions([]); setError(''); setSavedMsg(''); setQuizTitle('');
        setSelectedSources(['opentrivia']); setDifficulty('medium');
        setQuestionType('boolean'); setAmountPer(5);
        setOtCategory('any'); setTaCategory('any'); setAiTopic('');
    }

    const sourceCounts = questions.reduce((acc, q, i) => {
        if (!acc[q.source]) acc[q.source] = { total: 0, accepted: 0 };
        acc[q.source].total++;
        if (accepted[i]) acc[q.source].accepted++;
        return acc;
    }, {});

    const btnSx = {
        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
        borderRadius: 3, fontWeight: 700,
        boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
        '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #9333ea)' },
    };

    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 15%, #e1bee7 45%, #ce93d8 70%, #ab47bc 100%)', py: 8 }}>
            <Container maxWidth="md">
                <Button onClick={() => navigate('/dashboard')} sx={{ color: '#7c3aed', mb: 3, fontWeight: 600 }}>← Back to Dashboard</Button>

                <Typography variant="h4" fontWeight={700} sx={{ color: '#2e1065', mb: 1 }}>🎯 Create Quiz</Typography>
                <Typography variant="body1" sx={{ color: '#6b21a8', mb: 4 }}>
                    {step === 1 && 'Select one or more sources — questions are generated in parallel and mixed together.'}
                    {step === 2 && 'Review questions from all sources — accept the best ones.'}
                    {step === 3 && 'Quiz saved and ready to use!'}
                </Typography>

                {/* Step indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
                    {['Configure', 'Review', 'Saved'].map((label, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontWeight: 700, fontSize: 14,
                                bgcolor: step >= i + 1 ? '#7c3aed' : 'rgba(255,255,255,0.5)',
                                color: step >= i + 1 ? '#fff' : '#9ca3af',
                            }}>
                                {step > i + 1 ? '✓' : i + 1}
                            </Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: step === i + 1 ? '#2e1065' : '#9ca3af' }}>{label}</Typography>
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

                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2e1065', mb: 0.5 }}>Question Sources</Typography>
                            <Typography fontSize={13} color="#6b7280" sx={{ mb: 2 }}>Select one or more — generated in parallel and mixed together</Typography>

                            <Grid container spacing={2} sx={{ mb: 4 }}>
                                {SOURCES.map((src) => {
                                    const isSelected = selectedSources.includes(src.id);
                                    return (
                                        <Grid item xs={12} sm={4} key={src.id}>
                                            <Card onClick={() => toggleSource(src.id)} sx={{
                                                cursor: 'pointer', position: 'relative',
                                                border: isSelected ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                                                bgcolor: isSelected ? '#faf5ff' : '#fff',
                                                borderRadius: 3, transition: 'all 0.2s',
                                                '&:hover': { borderColor: '#7c3aed', bgcolor: '#faf5ff' },
                                            }}>
                                                <Checkbox checked={isSelected} size="small"
                                                          sx={{ position: 'absolute', top: 6, right: 6, p: 0, color: '#7c3aed', '&.Mui-checked': { color: '#7c3aed' } }}
                                                          onClick={(e) => e.stopPropagation()} onChange={() => toggleSource(src.id)}
                                                />
                                                <CardContent sx={{ p: 2.5, pr: 4 }}>
                                                    <Typography fontSize={28} mb={0.5}>{src.icon}</Typography>
                                                    <Typography fontWeight={700} fontSize={14} color="#2e1065">{src.label}</Typography>
                                                    <Typography fontSize={11} color="#6b7280" mt={0.5} lineHeight={1.4}>{src.description}</Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>

                            {/* OpenAI topic */}
                            {openaiSelected && (
                                <Box sx={{ mb: 3, p: 2.5, bgcolor: '#faf5ff', borderRadius: 3, border: '1px solid #e9d5ff' }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2e1065', mb: 1 }}>🤖 OpenAI Topic *</Typography>
                                    <TextField fullWidth placeholder='e.g. "World War 2", "Premier League Football"'
                                               value={aiTopic} onChange={(e) => setAiTopic(e.target.value)}
                                               sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff', '&.Mui-focused fieldset': { borderColor: '#7c3aed' } } }}
                                    />
                                </Box>
                            )}

                            {/* Open Trivia category */}
                            {selectedSources.includes('opentrivia') && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2e1065', mb: 1 }}>🎲 Open Trivia DB Category</Typography>
                                    <FormControl fullWidth>
                                        <Select value={otCategory} onChange={(e) => setOtCategory(e.target.value)}
                                                sx={{ borderRadius: 2, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7c3aed' } }}>
                                            {OPEN_TRIVIA_CATEGORIES.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.label}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}

                            {/* Trivia API category */}
                            {triviaApiSelected && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2e1065', mb: 1 }}>📚 The Trivia API Category</Typography>
                                    <FormControl fullWidth>
                                        <Select value={taCategory} onChange={(e) => setTaCategory(e.target.value)}
                                                sx={{ borderRadius: 2, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7c3aed' } }}>
                                            {TRIVIA_API_CATEGORIES.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.label}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}

                            {/* Format */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2e1065', mb: 1 }}>Question Format</Typography>
                                <ToggleButtonGroup value={questionType} exclusive onChange={(_, val) => val && setQuestionType(val)} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                    {[
                                        { value: 'boolean',  label: '✓/✗ True / False' },
                                        { value: 'multiple', label: '⊙ Multiple Choice' },
                                        ...(!triviaApiSelected && !openaiSelected ? [{ value: 'any', label: '☰ Mixed' }] : []),
                                    ].map((t) => (
                                        <ToggleButton key={t.value} value={t.value} sx={{
                                            borderRadius: '8px !important', border: '2px solid #e5e7eb !important', fontWeight: 600, px: 3,
                                            '&.Mui-selected': { bgcolor: '#faf5ff !important', borderColor: '#7c3aed !important', color: '#7c3aed' },
                                        }}>{t.label}</ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                                {triviaApiSelected && <Typography fontSize={12} color="#6b7280" mt={0.5}>ℹ The Trivia API only supports Multiple Choice</Typography>}
                            </Box>

                            {/* Difficulty */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2e1065', mb: 1 }}>Difficulty</Typography>
                                <ToggleButtonGroup value={difficulty} exclusive onChange={(_, val) => val && setDifficulty(val)} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                    {[
                                        { value: 'easy', label: '😊 Easy', color: '#16a34a' },
                                        { value: 'medium', label: '🤔 Medium', color: '#d97706' },
                                        { value: 'hard', label: '🔥 Hard', color: '#dc2626' },
                                        { value: 'any', label: '🎲 Any', color: '#7c3aed' },
                                    ].map((opt) => (
                                        <ToggleButton key={opt.value} value={opt.value} sx={{
                                            borderRadius: '8px !important', border: '2px solid #e5e7eb !important', fontWeight: 600, px: 3,
                                            '&.Mui-selected': { bgcolor: '#faf5ff !important', borderColor: `${opt.color} !important`, color: opt.color },
                                        }}>{opt.label}</ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                            </Box>

                            {/* Amount per source */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#2e1065', mb: 2 }}>
                                    Questions per source — <Box component="span" sx={{ color: '#7c3aed' }}>{amountPer}</Box>
                                    {selectedSources.length > 1 && (
                                        <Box component="span" sx={{ color: '#9ca3af', fontWeight: 400, fontSize: 13 }}>
                                            {' '}(~{amountPer * selectedSources.length} total)
                                        </Box>
                                    )}
                                </Typography>
                                <Slider value={amountPer} min={5} max={20} step={5} marks onChange={(_, val) => setAmountPer(val)}
                                        sx={{ color: '#7c3aed', '& .MuiSlider-mark': { bgcolor: '#c4b5fd' } }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography fontSize={12} color="#9ca3af">5</Typography>
                                    <Typography fontSize={12} color="#9ca3af">20</Typography>
                                </Box>
                            </Box>

                            {/* Summary */}
                            {selectedSources.length > 0 && (
                                <Box sx={{ p: 2, bgcolor: '#f5f3ff', borderRadius: 2, mb: 3 }}>
                                    <Typography fontSize={13} fontWeight={600} color="#5b21b6" mb={1}>Will generate from:</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {selectedSources.map((id) => {
                                            const src = SOURCES.find((s) => s.id === id);
                                            return <Chip key={id} label={`${src.icon} ${src.label} · ${amountPer} questions`}
                                                         sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 600, fontSize: 12 }} />;
                                        })}
                                    </Box>
                                </Box>
                            )}

                            <Button fullWidth variant="contained" size="large" onClick={handleGenerate}
                                    disabled={loading || selectedSources.length === 0} sx={{ ...btnSx, py: 1.8, fontSize: 16 }}>
                                {loading
                                    ? <><CircularProgress size={20} sx={{ color: '#fff', mr: 1 }} />Generating from {selectedSources.length} source{selectedSources.length > 1 ? 's' : ''}...</>
                                    : `✨ Generate from ${selectedSources.length} Source${selectedSources.length > 1 ? 's' : ''}`}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* ── STEP 2 ── */}
                {step === 2 && (
                    <Box>
                        <Card sx={{ borderRadius: 3, mb: 2, boxShadow: '0 2px 12px rgba(124,58,237,0.08)' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                    <Typography fontWeight={700} color="#2e1065" fontSize={15}>
                                        <Box component="span" sx={{ color: '#7c3aed', fontWeight: 800 }}>{acceptedCount}</Box> of {questions.length} accepted
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button size="small" onClick={acceptAll} sx={{ color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 2 }}>Accept All</Button>
                                        <Button size="small" onClick={rejectAll} sx={{ color: '#dc2626', border: '1px solid #fecaca', borderRadius: 2 }}>Reject All</Button>
                                        <Button size="small" onClick={() => setStep(1)} sx={{ color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 2 }}>← Back</Button>
                                    </Box>
                                </Box>
                                {/* Per-source controls */}
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {Object.entries(sourceCounts).map(([src, counts]) => (
                                        <Box key={src} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#f9fafb', borderRadius: 2, px: 1.5, py: 0.5 }}>
                                            <Chip label={src} size="small" sx={{ ...SOURCE_COLOURS[src], fontWeight: 600, fontSize: 11 }} />
                                            <Typography fontSize={12} color="#6b7280">{counts.accepted}/{counts.total}</Typography>
                                            <Button size="small" onClick={() => acceptBySource(src)} sx={{ fontSize: 11, color: '#16a34a', minWidth: 0, px: 0.5 }}>✓ all</Button>
                                            <Button size="small" onClick={() => rejectBySource(src)} sx={{ fontSize: 11, color: '#dc2626', minWidth: 0, px: 0.5 }}>✗ all</Button>
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: 3, mb: 2, boxShadow: '0 2px 12px rgba(124,58,237,0.08)' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography fontWeight={700} color="#2e1065" mb={1} fontSize={14}>Quiz Title</Typography>
                                <TextField fullWidth size="small" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)}
                                           placeholder="Enter a title for this quiz"
                                           sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&.Mui-focused fieldset': { borderColor: '#7c3aed' } } }}
                                />
                            </CardContent>
                        </Card>

                        {questions.map((q, i) => (
                            <Card key={i} sx={{
                                borderRadius: 3, mb: 2,
                                borderLeft: accepted[i] ? '4px solid #7c3aed' : '4px solid #e5e7eb',
                                opacity: accepted[i] ? 1 : 0.5, transition: 'all 0.2s',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                                        <Typography fontWeight={800} color="#7c3aed" fontSize={14} minWidth={28}>Q{i + 1}</Typography>
                                        <Chip label={q.source} size="small" sx={{ ...SOURCE_COLOURS[q.source], fontWeight: 600, fontSize: 11 }} />
                                        <Chip label={q.difficulty} size="small" sx={{ bgcolor: '#f3f4f6', color: '#374151', fontSize: 11 }} />
                                        <Chip label={q.type === 'boolean' ? 'True/False' : 'MCQ'} size="small" sx={{ bgcolor: '#f3f4f6', color: '#374151', fontSize: 11 }} />
                                        <Box sx={{ flex: 1 }} />
                                        <Button size="small" onClick={() => toggleAccepted(i)} sx={{
                                            borderRadius: 2, fontWeight: 600, fontSize: 12, px: 1.5,
                                            bgcolor: accepted[i] ? '#d1fae5' : '#fee2e2',
                                            color: accepted[i] ? '#065f46' : '#991b1b',
                                            '&:hover': { bgcolor: accepted[i] ? '#a7f3d0' : '#fecaca' },
                                        }}>{accepted[i] ? '✓ Accepted' : '✗ Rejected'}</Button>
                                    </Box>
                                    <Typography fontWeight={500} color="#1f2937" mb={1.5} lineHeight={1.5}>{q.question}</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Chip label={`✓ ${q.correct_answer}`} sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 500 }} />
                                        {q.incorrect_answers?.map((ans, j) => <Chip key={j} label={`✗ ${ans}`} sx={{ bgcolor: '#f3f4f6', color: '#6b7280' }} />)}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}

                        <Button fullWidth variant="contained" size="large" onClick={handleSave}
                                disabled={loading || acceptedCount === 0} sx={{ ...btnSx, mt: 1, py: 1.8, fontSize: 16 }}>
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
                            <Typography color="#6b21a8" mb={4}>{savedMsg}</Typography>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Button variant="contained" onClick={handleReset} sx={{ ...btnSx, px: 4 }}>+ Create Another</Button>
                                <Button variant="outlined" onClick={() => navigate('/dashboard/my-quizzes')} sx={{ borderColor: '#7c3aed', color: '#7c3aed', borderRadius: 3, fontWeight: 700, px: 4 }}>
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