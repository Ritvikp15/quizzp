import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

function Settings() {
    const navigate = useNavigate();

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 15%, #e1bee7 45%, #ce93d8 70%, #ab47bc 100%)',
            py: 8
        }}>
            <Container maxWidth="lg">
                <Button onClick={() => navigate('/dashboard')} sx={{ color: '#7c3aed', mb: 3, fontWeight: 600 }}>
                    ← Back to Dashboard
                </Button>
                <Typography variant="h4" fontWeight={700} sx={{ color: '#2e1065', mb: 2 }}>
                    ⚙️ Settings
                </Typography>
                <Typography variant="body1" sx={{ color: '#6b21a8' }}>
                    Account preferences and settings will appear here.
                </Typography>
            </Container>
        </Box>
    );
}

export default Settings;
