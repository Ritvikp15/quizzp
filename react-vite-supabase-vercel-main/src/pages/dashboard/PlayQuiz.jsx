/**
 * PlayQuiz.jsx — Quiz Host View
 * Place at: src/pages/dashboard/PlayQuiz.jsx
 *
 * Add route in main.jsx:
 *   import PlayQuiz from './pages/dashboard/PlayQuiz'
 *   <Route path="/dashboard/play/:id" element={<PlayQuiz />} />
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import supabase from '../../utils/supabase';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

// Generate a random 6-char join code
function makeJoinCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function PlayQuiz() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [quiz,       setQuiz]       = useState(null);
    const [session,    setSession]    = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState('');
    const [phase,      setPhase]      = useState('lobby');   // lobby | playing | finished
    const [current,    setCurrent]    = useState(0);
    const [revealed,   setRevealed]   = useState(false);
    const [results,    setResults]    = useState([]);
    const [copied,     setCopied]     = useState(false);

    useEffect(() => { init(); }, [id]);

    // Poll for player results every 3 seconds when playing
    useEffect(() => {
        if (phase !== 'playing' && phase !== 'finished') return;
        const interval = setInterval(fetchResults, 3000);
        return () => clearInterval(interval);
    }, [phase, session]);

    async function init() {
        setLoading(true);
        try {
            // Fetch quiz
            const { data: quizData, error: qErr } = await supabase
                .from('quizzes').select('*').eq('id', id).single();
            if (qErr) throw new Error(qErr.message);
            setQuiz(quizData);

            // Create session
            const { data: { user } } = await supabase.auth.getUser();
            const joinCode = makeJoinCode();
            const { data: sessionData, error: sErr } = await supabase
                .from('quiz_sessions')
                .insert({ quiz_id: id, host_id: user.id, join_code: joinCode, status: 'waiting' })
                .select().single();
            if (sErr) throw new Error(sErr.message);
            setSession(sessionData);
        } catch (err) {
            setError(err.message || 'Failed to start quiz session.');
        } finally {
            setLoading(false);
        }
    }

    async function fetchResults() {
        if (!session) return;
        const { data } = await supabase
            .from('quiz_results')
            .select('*')
            .eq('session_id', session.id)
            .order('score', { ascending: false });
        if (data) setResults(data);
    }

    async function startQuiz() {
        await supabase.from('quiz_sessions').update({ status: 'active' }).eq('id', session.id);
        setPhase('playing');
        setCurrent(0);
        setRevealed(false);
    }

    function nextQuestion() {
        if (current < quiz.questions.length - 1) {
            setCurrent((p) => p + 1);
            setRevealed(false);
        } else {
            finishQuiz();
        }
    }

    async function finishQuiz() {
        await supabase.from('quiz_sessions').update({ status: 'finished' }).eq('id', session.id);
        await fetchResults();
        setPhase('finished');
    }

    function copyJoinLink() {
        const link = `${window.location.origin}/join?code=${session?.join_code}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function shareWhatsApp() {
        const link = `${window.location.origin}/join?code=${session?.join_code}`;
        const msg  = encodeURIComponent(`🎯 Join my Quizzp quiz!\n\nCode: ${session?.join_code}\nLink: ${link}`);
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    }

    const btnSx = {
        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
        borderRadius: 3, fontWeight: 700,
        boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
        '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #9333ea)' },
    };

    if (loading) return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fce4ec 0%, #e1bee7 50%, #ab47bc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: '#7c3aed' }} />
        </Box>
    );

    if (error) return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fce4ec 0%, #e1bee7 50%, #ab47bc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        </Box>
    );

    const q = quiz?.questions?.[current];

    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 15%, #e1bee7 45%, #ce93d8 70%, #ab47bc 100%)', py: 8 }}>
            <Container maxWidth="md">
                <Button onClick={() => navigate('/dashboard/my-quizzes')} sx={{ color: '#7c3aed', mb: 3, fontWeight: 600 }}>
                    ← Back to My Quizzes
                </Button>

                {/* ── LOBBY ── */}
                {phase === 'lobby' && (
                    <Box>
                        <Typography variant="h4" fontWeight={700} sx={{ color: '#2e1065', mb: 1 }}>
                            🎮 {quiz?.title}
                        </Typography>
                        <Typography sx={{ color: '#6b21a8', mb: 4 }}>
                            {quiz?.questions?.length} questions · Share the code below with your players
                        </Typography>

                        {/* Join code card */}
                        <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(124,58,237,0.2)', mb: 3, background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                            <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                <Typography fontSize={14} fontWeight={600} sx={{ color: 'rgba(255,255,255,0.8)', mb: 1, textTransform: 'uppercase', letterSpacing: 2 }}>
                                    Join Code
                                </Typography>
                                <Typography sx={{
                                    fontSize: 72, fontWeight: 900, color: '#fff', letterSpacing: 16,
                                    lineHeight: 1, mb: 2, fontFamily: 'monospace',
                                }}>
                                    {session?.join_code}
                                </Typography>
                                <Typography fontSize={13} sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                                    Players go to: <strong>{window.location.origin}/join</strong>
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <Button onClick={copyJoinLink} variant="contained" sx={{
                                        bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 2, fontWeight: 600,
                                        border: '1px solid rgba(255,255,255,0.4)',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                                    }}>
                                        {copied ? '✓ Copied!' : '🔗 Copy Link'}
                                    </Button>
                                    <Button onClick={shareWhatsApp} variant="contained" sx={{
                                        bgcolor: '#25D366', color: '#fff', borderRadius: 2, fontWeight: 600,
                                        '&:hover': { bgcolor: '#128C7E' },
                                    }}>
                                        📱 Share WhatsApp
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Players waiting */}
                        <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 4px 20px rgba(124,58,237,0.1)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography fontWeight={700} color="#2e1065">
                                        👥 Players Joined — <Box component="span" sx={{ color: '#7c3aed' }}>{results.length}</Box>
                                    </Typography>
                                    <Button size="small" onClick={fetchResults} sx={{ color: '#7c3aed', fontSize: 12 }}>
                                        🔄 Refresh
                                    </Button>
                                </Box>
                                {results.length === 0 ? (
                                    <Typography color="#9ca3af" fontSize={14}>Waiting for players to join...</Typography>
                                ) : (
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {results.map((r) => (
                                            <Chip key={r.id} label={r.player_name} sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 600 }} />
                                        ))}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>

                        <Button fullWidth variant="contained" size="large" onClick={startQuiz} sx={{ ...btnSx, py: 1.8, fontSize: 16 }}>
                            🚀 Start Quiz ({quiz?.questions?.length} questions)
                        </Button>
                    </Box>
                )}

                {/* ── PLAYING ── */}
                {phase === 'playing' && q && (
                    <Box>
                        {/* Progress */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography fontWeight={700} color="#2e1065" fontSize={15}>
                                Question <Box component="span" sx={{ color: '#7c3aed' }}>{current + 1}</Box> of {quiz.questions.length}
                            </Typography>
                            <Chip label={`👥 ${results.length} players`} sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 600 }} />
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={((current + 1) / quiz.questions.length) * 100}
                            sx={{ mb: 3, height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.4)', '& .MuiLinearProgress-bar': { bgcolor: '#7c3aed', borderRadius: 4 } }}
                        />

                        {/* Question card */}
                        <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(124,58,237,0.15)', mb: 3 }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                                    <Chip label={q.source} size="small" sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 600 }} />
                                    <Chip label={q.difficulty} size="small" sx={{ bgcolor: '#f3f4f6', color: '#374151' }} />
                                    <Chip label={q.category} size="small" sx={{ bgcolor: '#f3f4f6', color: '#374151' }} />
                                </Box>

                                <Typography variant="h5" fontWeight={700} color="#1f2937" mb={4} lineHeight={1.4}>
                                    {q.question}
                                </Typography>

                                {/* Answers */}
                                {q.type === 'boolean' ? (
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        {['True', 'False'].map((ans) => {
                                            const isCorrect = ans === q.correct_answer;
                                            return (
                                                <Box key={ans} sx={{
                                                    flex: 1, p: 3, borderRadius: 3, textAlign: 'center',
                                                    border: '2px solid',
                                                    borderColor: revealed ? (isCorrect ? '#16a34a' : '#e5e7eb') : '#e5e7eb',
                                                    bgcolor: revealed ? (isCorrect ? '#d1fae5' : '#f9fafb') : '#f9fafb',
                                                    transition: 'all 0.3s',
                                                }}>
                                                    <Typography fontWeight={700} fontSize={20} color={revealed ? (isCorrect ? '#16a34a' : '#9ca3af') : '#374151'}>
                                                        {revealed && isCorrect ? '✓ ' : ''}{ans}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        {[q.correct_answer, ...(q.incorrect_answers || [])].sort(() => Math.random() - 0.5).map((ans, i) => {
                                            const isCorrect = ans === q.correct_answer;
                                            const colours   = ['#dbeafe', '#fef3c7', '#d1fae5', '#fce7f3'];
                                            const textCols  = ['#1e40af', '#92400e', '#065f46', '#9d174d'];
                                            return (
                                                <Box key={i} sx={{
                                                    p: 2.5, borderRadius: 3, border: '2px solid',
                                                    borderColor: revealed ? (isCorrect ? '#16a34a' : '#e5e7eb') : '#e5e7eb',
                                                    bgcolor: revealed ? (isCorrect ? '#d1fae5' : '#f9fafb') : colours[i % 4],
                                                    transition: 'all 0.3s',
                                                }}>
                                                    <Typography fontWeight={600} fontSize={14}
                                                                color={revealed ? (isCorrect ? '#16a34a' : '#9ca3af') : textCols[i % 4]}>
                                                        {revealed && isCorrect ? '✓ ' : ''}{ans}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>

                        {/* Host controls */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {!revealed ? (
                                <Button fullWidth variant="contained" size="large" onClick={() => setRevealed(true)} sx={{ ...btnSx, py: 1.8, fontSize: 16 }}>
                                    👁 Reveal Answer
                                </Button>
                            ) : (
                                <Button fullWidth variant="contained" size="large" onClick={nextQuestion} sx={{ ...btnSx, py: 1.8, fontSize: 16 }}>
                                    {current < quiz.questions.length - 1 ? `→ Next Question (${current + 2}/${quiz.questions.length})` : '🏁 Finish Quiz'}
                                </Button>
                            )}
                        </Box>

                        {/* Live leaderboard */}
                        {results.length > 0 && (
                            <Card sx={{ borderRadius: 3, mt: 3, boxShadow: '0 4px 20px rgba(124,58,237,0.1)' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography fontWeight={700} color="#2e1065" mb={1.5}>🏆 Live Leaderboard</Typography>
                                    {results.slice(0, 5).map((r, i) => (
                                        <Box key={r.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: i < results.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Typography fontWeight={700} color={i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#92400e' : '#6b7280'} fontSize={18}>
                                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                                                </Typography>
                                                <Typography fontWeight={600} color="#1f2937">{r.player_name}</Typography>
                                            </Box>
                                            <Chip label={`${r.score} pts`} size="small" sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 700 }} />
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                )}

                {/* ── FINISHED ── */}
                {phase === 'finished' && (
                    <Box>
                        <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(124,58,237,0.2)', mb: 3, textAlign: 'center' }}>
                            <CardContent sx={{ p: 5 }}>
                                <Typography fontSize={64} mb={2}>🏆</Typography>
                                <Typography variant="h4" fontWeight={800} color="#2e1065" mb={1}>Quiz Complete!</Typography>
                                <Typography color="#6b21a8" mb={4}>{results.length} players completed the quiz</Typography>

                                {results.length === 0 ? (
                                    <Typography color="#9ca3af">No players submitted results.</Typography>
                                ) : (
                                    <Box>
                                        {results.map((r, i) => (
                                            <Box key={r.id} sx={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                p: 2, mb: 1, borderRadius: 3,
                                                bgcolor: i === 0 ? '#fef3c7' : i === 1 ? '#f3f4f6' : i === 2 ? '#fef3c7' : '#f9fafb',
                                                border: i === 0 ? '2px solid #f59e0b' : '2px solid transparent',
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Typography fontSize={24}>
                                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                                                    </Typography>
                                                    <Typography fontWeight={700} color="#1f2937" fontSize={16}>{r.player_name}</Typography>
                                                </Box>
                                                <Typography fontWeight={800} color="#7c3aed" fontSize={18}>{r.score} pts</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button variant="contained" onClick={() => navigate('/dashboard/my-quizzes')} sx={{ ...btnSx, flex: 1, py: 1.5 }}>
                                ← My Quizzes
                            </Button>
                            <Button variant="outlined" onClick={() => navigate('/dashboard/analytics')} sx={{ borderColor: '#7c3aed', color: '#7c3aed', borderRadius: 3, fontWeight: 700, flex: 1, py: 1.5 }}>
                                📊 View Analytics
                            </Button>
                        </Box>
                    </Box>
                )}
            </Container>
        </Box>
    );
}