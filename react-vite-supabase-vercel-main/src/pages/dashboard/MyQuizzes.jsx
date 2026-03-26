/**
 * MyQuizzes.jsx
 * Place at: src/pages/dashboard/MyQuizzes.jsx
 * Replace the existing empty file
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import supabase from '../../utils/supabase';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

export default function MyQuizzes() {
    const navigate = useNavigate();

    const [quizzes,  setQuizzes]  = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState('');
    const [preview,  setPreview]  = useState(null);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => { fetchQuizzes(); }, []);

    async function fetchQuizzes() {
        setLoading(true);
        setError('');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error: dbErr } = await supabase
                .from('quizzes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (dbErr) throw new Error(dbErr.message);
            setQuizzes(data || []);
        } catch (err) {
            setError(err.message || 'Failed to load quizzes.');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        setDeleting(id);
        try {
            const { error: dbErr } = await supabase.from('quizzes').delete().eq('id', id);
            if (dbErr) throw new Error(dbErr.message);
            setQuizzes((prev) => prev.filter((q) => q.id !== id));
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleting(null);
        }
    }

    function sourceColour(source) {
        if (source === 'OpenAI')         return { bgcolor: '#ede9fe', color: '#5b21b6' };
        if (source === 'Open Trivia DB') return { bgcolor: '#dbeafe', color: '#1e40af' };
        if (source === 'The Trivia API') return { bgcolor: '#d1fae5', color: '#065f46' };
        return                                  { bgcolor: '#f3f4f6', color: '#374151' };
    }

    function formatDate(iso) {
        return new Date(iso).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 15%, #e1bee7 45%, #ce93d8 70%, #ab47bc 100%)',
            py: 8,
        }}>
            <Container maxWidth="lg">

                <Button onClick={() => navigate('/dashboard')} sx={{ color: '#7c3aed', mb: 3, fontWeight: 600 }}>
                    ← Back to Dashboard
                </Button>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={700} sx={{ color: '#2e1065' }}>
                            📚 My Quizzes
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#6b21a8', mt: 0.5 }}>
                            {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} saved
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/dashboard/create-quiz')}
                        sx={{
                            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            borderRadius: 3, fontWeight: 700, px: 3,
                            boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
                            '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #9333ea)' },
                        }}
                    >
                        + Create New Quiz
                    </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#7c3aed' }} />
                    </Box>
                )}

                {!loading && quizzes.length === 0 && (
                    <Card sx={{ borderRadius: 4, textAlign: 'center', boxShadow: '0 8px 32px rgba(124,58,237,0.12)' }}>
                        <CardContent sx={{ py: 8 }}>
                            <Typography fontSize={64} mb={2}>🎯</Typography>
                            <Typography variant="h5" fontWeight={700} color="#2e1065" mb={1}>No quizzes yet</Typography>
                            <Typography color="#6b21a8" mb={4}>Create your first quiz to get started!</Typography>
                            <Button
                                variant="contained"
                                onClick={() => navigate('/dashboard/create-quiz')}
                                sx={{
                                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                    borderRadius: 3, fontWeight: 700, px: 4,
                                    boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
                                }}
                            >
                                + Create Quiz
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {!loading && quizzes.length > 0 && (
                    <Grid container spacing={3}>
                        {quizzes.map((quiz) => (
                            <Grid item xs={12} sm={6} md={4} key={quiz.id}>
                                <Card sx={{
                                    borderRadius: 4,
                                    boxShadow: '0 4px 20px rgba(124,58,237,0.1)',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 32px rgba(124,58,237,0.2)' },
                                }}>
                                    <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Chip label={quiz.source} size="small" sx={{ ...sourceColour(quiz.source), fontWeight: 600, fontSize: 11 }} />
                                            <Typography fontSize={12} color="#9ca3af">{formatDate(quiz.created_at)}</Typography>
                                        </Box>

                                        <Typography variant="h6" fontWeight={700} color="#2e1065" mb={1} sx={{
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {quiz.title}
                                        </Typography>

                                        <Typography fontSize={14} color="#6b21a8" mb={2}>
                                            {quiz.questions?.length || 0} questions
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3, flex: 1 }}>
                                            {[...new Set(quiz.questions?.map((q) => q.category) || [])].slice(0, 2).map((cat) => (
                                                <Chip key={cat} label={cat} size="small" sx={{ bgcolor: '#f3f4f6', color: '#374151', fontSize: 10 }} />
                                            ))}
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button size="small" variant="outlined" onClick={() => setPreview(quiz)} sx={{
                                                borderColor: '#7c3aed', color: '#7c3aed', borderRadius: 2, fontWeight: 600, flex: 1,
                                            }}>
                                                👁 Preview
                                            </Button>
                                            <Button size="small" variant="contained" onClick={() => navigate(`/dashboard/play/${quiz.id}`)} sx={{
                                                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                                borderRadius: 2, fontWeight: 600, flex: 1,
                                            }}>
                                                ▶ Start
                                            </Button>
                                            <Button size="small" onClick={() => handleDelete(quiz.id)} disabled={deleting === quiz.id} sx={{
                                                color: '#dc2626', borderRadius: 2, minWidth: 40,
                                                '&:hover': { bgcolor: '#fee2e2' },
                                            }}>
                                                {deleting === quiz.id ? <CircularProgress size={16} /> : '🗑'}
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Preview Dialog */}
                <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="sm" fullWidth
                        PaperProps={{ sx: { borderRadius: 4 } }}>
                    {preview && (
                        <>
                            <DialogTitle>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography fontWeight={700} color="#2e1065">{preview.title}</Typography>
                                    <IconButton onClick={() => setPreview(null)} size="small">✕</IconButton>
                                </Box>
                                <Chip label={preview.source} size="small" sx={{ mt: 1, ...sourceColour(preview.source), fontWeight: 600 }} />
                            </DialogTitle>
                            <DialogContent>
                                {preview.questions?.map((q, i) => (
                                    <Box key={i} sx={{ py: 2, borderBottom: i < preview.questions.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                        <Typography fontWeight={600} color="#1f2937" mb={1} fontSize={14}>
                                            Q{i + 1}. {q.question}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            <Chip label={`✓ ${q.correct_answer}`} size="small" sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 500 }} />
                                            {q.incorrect_answers?.map((ans, j) => (
                                                <Chip key={j} label={ans} size="small" sx={{ bgcolor: '#f3f4f6', color: '#6b7280' }} />
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                            </DialogContent>
                        </>
                    )}
                </Dialog>

            </Container>
        </Box>
    );
}