import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid2";

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            navigate('/auth/sign-in');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    if (!user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 15%, #e1bee7 45%, #ce93d8 70%, #ab47bc 100%)',
            py: 8
        }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4" fontWeight={700} sx={{ color: '#2e1065' }}>
                        Dashboard
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={handleLogout}
                        sx={{
                            color: '#7c3aed',
                            borderColor: '#7c3aed',
                            fontWeight: 600,
                            '&:hover': {
                                borderColor: '#6d28d9',
                                backgroundColor: 'rgba(124, 58, 237, 0.1)'
                            }
                        }}
                    >
                        Logout
                    </Button>
                </Box>

                {/* Welcome Card */}
                <Card sx={{
                    mb: 4,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none'
                }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#2e1065' }}>
                            Welcome back, {user.name}! 👋
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#6b21a8', mb: 3 }}>
                            Ready to create some amazing quizzes?
                        </Typography>
                        <Box sx={{ mt: 3, p: 3, backgroundColor: 'rgba(124, 58, 237, 0.05)', borderRadius: 2 }}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Typography variant="body2" sx={{ color: '#6b21a8', fontWeight: 600 }}>
                                        Email
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: '#2e1065' }}>
                                        {user.email}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Typography variant="body2" sx={{ color: '#6b21a8', fontWeight: 600 }}>
                                        Role
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: '#2e1065', textTransform: 'capitalize' }}>
                                        {user.role.replace('_', ' ')}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Typography variant="body2" sx={{ color: '#6b21a8', fontWeight: 600 }}>
                                        User ID
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: '#2e1065', fontSize: '0.9rem' }}>
                                        {user.id.substring(0, 8)}...
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Typography variant="h5" fontWeight={600} sx={{ color: '#2e1065', mb: 3 }}>
                    Quick Actions
                </Typography>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card onClick={() => navigate('/dashboard/create-quiz')} sx={{
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            cursor: 'pointer',
                            border: 'none',
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 30px rgba(124, 58, 237, 0.2)'
                            }
                        }}>
                            <CardContent sx={{ textAlign: 'center', p: 4 }}>
                                <Typography variant="h1" sx={{ mb: 2, fontSize: '3rem' }}>🎯</Typography>
                                <Typography variant="h6" fontWeight={600} sx={{ color: '#2e1065', mb: 1 }}>
                                    Create Quiz
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6b21a8' }}>
                                    Start a new quiz with AI generation
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card onClick={() => navigate('/dashboard/my-quizzes')} sx={{
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            cursor: 'pointer',
                            border: 'none',
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 30px rgba(124, 58, 237, 0.2)'
                            }
                        }}>
                            <CardContent sx={{ textAlign: 'center', p: 4 }}>
                                <Typography variant="h1" sx={{ mb: 2, fontSize: '3rem' }}>📊</Typography>
                                <Typography variant="h6" fontWeight={600} sx={{ color: '#2e1065', mb: 1 }}>
                                    My Quizzes
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6b21a8' }}>
                                    View and manage all your quizzes
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card onClick={() => navigate('/dashboard/analytics')} sx={{
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            cursor: 'pointer',
                            border: 'none',
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 30px rgba(124, 58, 237, 0.2)'
                            }
                        }}>
                            <CardContent sx={{ textAlign: 'center', p: 4 }}>
                                <Typography variant="h1" sx={{ mb: 2, fontSize: '3rem' }}>📈</Typography>
                                <Typography variant="h6" fontWeight={600} sx={{ color: '#2e1065', mb: 1 }}>
                                    Analytics
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6b21a8' }}>
                                    View quiz statistics and insights
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card onClick={() => navigate('/dashboard/settings')} sx={{
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            cursor: 'pointer',
                            border: 'none',
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 30px rgba(124, 58, 237, 0.2)'
                            }
                        }}>
                            <CardContent sx={{ textAlign: 'center', p: 4 }}>
                                <Typography variant="h1" sx={{ mb: 2, fontSize: '3rem' }}>⚙️</Typography>
                                <Typography variant="h6" fontWeight={600} sx={{ color: '#2e1065', mb: 1 }}>
                                    Settings
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6b21a8' }}>
                                    Manage your account preferences
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card onClick={() => navigate('/dashboard/support')} sx={{
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            cursor: 'pointer',
                            border: 'none',
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 30px rgba(124, 58, 237, 0.2)'
                            }
                        }}>
                            <CardContent sx={{ textAlign: 'center', p: 4 }}>
                                <Typography variant="h1" sx={{ mb: 2, fontSize: '3rem' }}>💬</Typography>
                                <Typography variant="h6" fontWeight={600} sx={{ color: '#2e1065', mb: 1 }}>
                                    Support
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6b21a8' }}>
                                    Get help and contact support
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card sx={{
                            borderRadius: 4,
                            backgroundColor: 'rgba(124, 58, 237, 0.1)',
                            cursor: 'pointer',
                            border: '2px dashed #7c3aed',
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                backgroundColor: 'rgba(124, 58, 237, 0.15)',
                            }
                        }}>
                            <CardContent sx={{ textAlign: 'center', p: 4 }}>
                                <Typography variant="h1" sx={{ mb: 2, fontSize: '3rem' }}>➕</Typography>
                                <Typography variant="h6" fontWeight={600} sx={{ color: '#7c3aed', mb: 1 }}>
                                    Coming Soon
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#7c3aed' }}>
                                    More features on the way!
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

export default Dashboard;