/**
 * JoinQuiz.jsx — Quiz Player View
 * Place at: src/pages/JoinQuiz.jsx
 *
 * Add route in main.jsx:
 *   import JoinQuiz from './pages/JoinQuiz'
 *   <Route path="/join" element={<JoinQuiz />} />
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import supabase from '../utils/supabase';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const OPTION_STYLES = [
    { bgcolor: '#dbeafe', color: '#1e40af', hover: '#bfdbfe' },
    { bgcolor: '#fef3c7', color: '#92400e', hover: '#fde68a' },
    { bgcolor: '#d1fae5', color: '#065f46', hover: '#a7f3d0' },
    { bgcolor: '#fce7f3', color: '#9d174d', hover: '#fbcfe8' },
];

export default function JoinQuiz() {
    const [searchParams] = useSearchParams();
    const codeFromUrl    = searchParams.get('code') || '';

    const [phase,      setPhase]      = useState('join');   // join | playing | finished
    const [joinCode,   setJoinCode]   = useState(codeFromUrl.toUpperCase());
    const [playerName, setPlayerName] = useState('');
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState('');

    const [session,    setSession]    = useState(null);
    const [questions,  setQuestions]  = useState([]);
    const [current,    setCurrent]    = useState(0);
    const [selected,   setSelected]   = useState(null);
    const [answered,   setAnswered]   = useState(false);
    const [score,      setScore]      = useState(0);
    const [answers,    setAnswers]    = useState([]);
    const [timeLeft,   setTimeLeft]   = useState(20);
    const timerRef = useRef(null);

    // Shuffle answers once per question
    const [shuffled, setShuffled] = useState([]);
    useEffect(() => {
        if (questions.length === 0) return;
        const q = questions[current];
        const all = [q.correct_answer, ...(q.incorrect_answers || [])].sort(() => Math.random() - 0.5);
        setShuffled(all);
        setSelected(null);
        setAnswered(false);
        setTimeLeft(20);
    }, [current, questions]);

    // Timer countdown
    useEffect(() => {
        if (phase !== 'playing' || answered) return;
        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    handleTimeout();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [phase, current, answered]);

    function handleTimeout() {
        if (!answered) submitAnswer(null);
    }

    // ── Join ──────────────────────────────────────────────────────────────────
    async function handleJoin() {
        setError('');
        if (!joinCode.trim()) { setError('Please enter a join code.'); return; }
        if (!playerName.trim()) { setError('Please enter your name.'); return; }
        setLoading(true);
        try {
            const { data: sessionData, error: sErr } = await supabase
                .from('quiz_sessions')
                .select('*, quizzes(*)')
                .eq('join_code', joinCode.toUpperCase().trim())
                .in('status', ['waiting', 'active'])
                .single();

            if (sErr || !sessionData) throw new Error('Quiz not found. Check your code and try again.');

            const qs = sessionData.quizzes?.questions || [];
            if (qs.length === 0) throw new Error('This quiz has no questions.');

            setSession(sessionData);
            setQuestions(qs);
            setPhase('playing');
        } catch (err) {
            setError(err.message || 'Failed to join. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    // ── Answer ────────────────────────────────────────────────────────────────
    async function submitAnswer(ans) {
        if (answered) return;
        clearInterval(timerRef.current);
        setSelected(ans);
        setAnswered(true);

        const q          = questions[current];
        const isCorrect  = ans === q.correct_answer;
        const points     = isCorrect ? Math.max(100, timeLeft * 10) : 0;
        const newScore   = score + points;
        const newAnswers = [...answers, { question: q.question, selected: ans, correct: q.correct_answer, isCorrect }];

        setScore(newScore);
        setAnswers(newAnswers);

        // Auto-advance after 2 seconds
        setTimeout(() => {
            if (current < questions.length - 1) {
                setCurrent((p) => p + 1);
            } else {
                saveResults(newScore, newAnswers);
            }
        }, 2000);
    }

    async function saveResults(finalScore, finalAnswers) {
        try {
            await supabase.from('quiz_results').insert({
                session_id:  session.id,
                player_name: playerName.trim(),
                score:       finalScore,
                answers:     finalAnswers,
            });
        } catch (err) {
            console.error('Failed to save results:', err);
        } finally {
            setPhase('finished');
        }
    }

    const q = questions[current];
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const pct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    const btnSx = {
        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
        borderRadius: 3, fontWeight: 700,
        boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
        '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #9333ea)' },
    };

    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 15%, #e1bee7 45%, #ce93d8 70%, #ab47bc 100%)', py: 8 }}>
            <Container maxWidth="sm">

                {/* ── JOIN ── */}
                {phase === 'join' && (
                    <Box>
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Typography variant="h3" fontWeight={900} sx={{ color: '#2e1065', mb: 1 }}>
                                🎯 Quizzp
                            </Typography>
                            <Typography color="#6b21a8" fontSize={16}>
                                Enter your details to join the quiz
                            </Typography>
                        </Box>

                        <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(124,58,237,0.15)' }}>
                            <CardContent sx={{ p: 4 }}>
                                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

                                <Typography fontWeight={700} color="#2e1065" mb={1}>Your Name</Typography>
                                <TextField
                                    fullWidth
                                    placeholder="Enter your name"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                    sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2, '&.Mui-focused fieldset': { borderColor: '#7c3aed' } } }}
                                />

                                <Typography fontWeight={700} color="#2e1065" mb={1}>Join Code</Typography>
                                <TextField
                                    fullWidth
                                    placeholder="e.g. ABC123"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                    inputProps={{ style: { fontFamily: 'monospace', fontSize: 24, fontWeight: 700, letterSpacing: 8, textAlign: 'center' } }}
                                    sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: 2, '&.Mui-focused fieldset': { borderColor: '#7c3aed' } } }}
                                />

                                <Button fullWidth variant="contained" size="large" onClick={handleJoin} disabled={loading} sx={{ ...btnSx, py: 1.8, fontSize: 16 }}>
                                    {loading ? <><CircularProgress size={20} sx={{ color: '#fff', mr: 1 }} />Joining...</> : '🚀 Join Quiz'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {/* ── PLAYING ── */}
                {phase === 'playing' && q && (
                    <Box>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography fontWeight={700} color="#2e1065">
                                Q<Box component="span" sx={{ color: '#7c3aed' }}>{current + 1}</Box>/{questions.length}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip label={`⭐ ${score} pts`} sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 700 }} />
                                <Chip
                                    label={`⏱ ${timeLeft}s`}
                                    sx={{
                                        bgcolor: timeLeft <= 5 ? '#fee2e2' : '#f3f4f6',
                                        color: timeLeft <= 5 ? '#dc2626' : '#374151',
                                        fontWeight: 700, fontFamily: 'monospace',
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Timer bar */}
                        <LinearProgress
                            variant="determinate"
                            value={(timeLeft / 20) * 100}
                            sx={{
                                mb: 3, height: 8, borderRadius: 4,
                                bgcolor: 'rgba(255,255,255,0.4)',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: timeLeft <= 5 ? '#dc2626' : '#7c3aed',
                                    borderRadius: 4,
                                    transition: 'none',
                                },
                            }}
                        />

                        {/* Question */}
                        <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(124,58,237,0.15)', mb: 3 }}>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h5" fontWeight={700} color="#1f2937" lineHeight={1.4} textAlign="center">
                                    {q.question}
                                </Typography>
                            </CardContent>
                        </Card>

                        {/* Answers */}
                        {q.type === 'boolean' ? (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {['True', 'False'].map((ans, i) => {
                                    const isCorrect  = ans === q.correct_answer;
                                    const isSelected = selected === ans;
                                    let bg = i === 0 ? '#dbeafe' : '#fce7f3';
                                    let col = i === 0 ? '#1e40af' : '#9d174d';
                                    if (answered) {
                                        bg  = isCorrect ? '#d1fae5' : isSelected ? '#fee2e2' : '#f3f4f6';
                                        col = isCorrect ? '#16a34a' : isSelected ? '#dc2626' : '#9ca3af';
                                    }
                                    return (
                                        <Box key={ans} onClick={() => !answered && submitAnswer(ans)} sx={{
                                            flex: 1, p: 3, borderRadius: 3, textAlign: 'center',
                                            bgcolor: bg, cursor: answered ? 'default' : 'pointer',
                                            border: '2px solid', borderColor: isSelected ? '#7c3aed' : 'transparent',
                                            transition: 'all 0.2s',
                                            '&:hover': !answered ? { transform: 'translateY(-2px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' } : {},
                                        }}>
                                            <Typography fontWeight={800} fontSize={22} color={col}>
                                                {answered && isCorrect ? '✓ ' : answered && isSelected && !isCorrect ? '✗ ' : ''}{ans}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        ) : (
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                {shuffled.map((ans, i) => {
                                    const isCorrect  = ans === q.correct_answer;
                                    const isSelected = selected === ans;
                                    const style      = OPTION_STYLES[i % 4];
                                    let bg  = style.bgcolor;
                                    let col = style.color;
                                    if (answered) {
                                        bg  = isCorrect ? '#d1fae5' : isSelected ? '#fee2e2' : '#f3f4f6';
                                        col = isCorrect ? '#16a34a' : isSelected ? '#dc2626' : '#9ca3af';
                                    }
                                    return (
                                        <Box key={i} onClick={() => !answered && submitAnswer(ans)} sx={{
                                            p: 2.5, borderRadius: 3, bgcolor: bg,
                                            cursor: answered ? 'default' : 'pointer',
                                            border: '2px solid', borderColor: isSelected ? '#7c3aed' : 'transparent',
                                            transition: 'all 0.2s',
                                            '&:hover': !answered ? { transform: 'translateY(-2px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' } : {},
                                        }}>
                                            <Typography fontWeight={700} fontSize={14} color={col}>
                                                {answered && isCorrect ? '✓ ' : answered && isSelected && !isCorrect ? '✗ ' : ''}{ans}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}

                        {/* Feedback after answering */}
                        {answered && (
                            <Box sx={{
                                mt: 3, p: 2.5, borderRadius: 3, textAlign: 'center',
                                bgcolor: selected === q.correct_answer ? '#d1fae5' : '#fee2e2',
                            }}>
                                <Typography fontWeight={800} fontSize={20}
                                            color={selected === q.correct_answer ? '#16a34a' : '#dc2626'}>
                                    {selected === q.correct_answer
                                        ? `✓ Correct! +${Math.max(100, timeLeft * 10)} points`
                                        : `✗ Incorrect — Answer: ${q.correct_answer}`}
                                </Typography>
                                <Typography fontSize={13} color="#6b7280" mt={0.5}>
                                    {current < questions.length - 1 ? 'Next question coming up...' : 'Last question — calculating score...'}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {/* ── FINISHED ── */}
                {phase === 'finished' && (
                    <Box>
                        <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(124,58,237,0.2)', mb: 3, textAlign: 'center' }}>
                            <CardContent sx={{ p: 5 }}>
                                <Typography fontSize={72} mb={2}>
                                    {pct >= 80 ? '🏆' : pct >= 60 ? '🎉' : pct >= 40 ? '👍' : '💪'}
                                </Typography>
                                <Typography variant="h4" fontWeight={800} color="#2e1065" mb={1}>
                                    Quiz Complete!
                                </Typography>
                                <Typography color="#6b21a8" mb={3} fontSize={16}>
                                    Well done, <strong>{playerName}</strong>!
                                </Typography>

                                <Box sx={{
                                    p: 3, borderRadius: 3, mb: 3,
                                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                }}>
                                    <Typography fontSize={13} fontWeight={600} sx={{ color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 2, mb: 0.5 }}>
                                        Final Score
                                    </Typography>
                                    <Typography fontSize={56} fontWeight={900} color="#fff" lineHeight={1}>
                                        {score}
                                    </Typography>
                                    <Typography fontSize={14} sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
                                        {correctCount}/{questions.length} correct · {pct}%
                                    </Typography>
                                </Box>

                                {/* Answer review */}
                                <Typography fontWeight={700} color="#2e1065" mb={2} textAlign="left">Your Answers</Typography>
                                {answers.map((a, i) => (
                                    <Box key={i} sx={{
                                        display: 'flex', alignItems: 'flex-start', gap: 1.5,
                                        p: 1.5, mb: 1, borderRadius: 2,
                                        bgcolor: a.isCorrect ? '#d1fae5' : '#fee2e2',
                                        textAlign: 'left',
                                    }}>
                                        <Typography fontSize={16}>{a.isCorrect ? '✓' : '✗'}</Typography>
                                        <Box>
                                            <Typography fontSize={13} fontWeight={600} color="#1f2937">{a.question}</Typography>
                                            {!a.isCorrect && (
                                                <Typography fontSize={12} color="#6b7280" mt={0.25}>
                                                    Correct answer: <strong>{a.correct}</strong>
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>

                        <Button fullWidth variant="contained" size="large" onClick={() => window.location.href = '/join'} sx={{ ...btnSx, py: 1.8, fontSize: 16 }}>
                            🎯 Play Another Quiz
                        </Button>
                    </Box>
                )}
            </Container>
        </Box>
    );
}