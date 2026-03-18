import "./App.css";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";

const features = [
    {
        icon: "⚡",
        title: "AI Quiz Generation",
        description: "Generate quiz questions automatically using advanced AI technology in seconds.",
    },
    {
        icon: "📊",
        title: "Q&A Smart Analysis",
        description: "Get detailed analytics and insights on quiz performance and player engagement.",
    },
    {
        icon: "🎯",
        title: "Multiple Quiz Modes",
        description: "Pub quiz, educational quizzes, and interactive learning modes for every need.",
    },
    {
        icon: "📱",
        title: "WhatsApp Integration",
        description: "Share and play quizzes directly through WhatsApp with seamless integration.",
    },
    {
        icon: "👥",
        title: "Analytics Dashboard",
        description: "Track player performance and quiz statistics in real-time with visual insights.",
    },
    {
        icon: "🔒",
        title: "Secure & Reliable",
        description: "Bank-level security with role-based access control for all users.",
    },
];

const steps = [
    {
        number: "01",
        title: "Enter Your Topic",
        description: "Simply tell us what quiz you want to create and let our AI do the magic."
    },
    {
        number: "02",
        title: "AI Generates Questions",
        description: "Our advanced AI creates relevant, engaging questions instantly with multiple choice options."
    },
    {
        number: "03",
        title: "Share & Track Results",
        description: "Share your quiz via WhatsApp or link and track performance in real-time."
    },
];

const testimonials = [
    {
        name: "Emily Parker",
        role: "Quiz Host",
        quote: "QuizMaster transformed our pub quiz nights. The AI generation saves me hours of work!",
    },
    {
        name: "David Chen",
        role: "Teacher",
        quote: "My students love the interactive quizzes. Perfect for remote learning and engagement.",
    },
    {
        name: "Sophie Williams",
        role: "Event Organizer",
        quote: "Best quiz platform I've used. The analytics help me understand what works best.",
    },
];

function App() {
    return (
        <Box sx={{ textAlign: "left" }}>

            {/* Hero */}
            <Box
                sx={{
                    background: "linear-gradient(135deg, #fce4ec 0%, #f8bbd0 15%, #e1bee7 45%, #ce93d8 70%, #ab47bc 100%)",
                    color: "#2e1065",
                    py: { xs: 10, md: 16 },
                    px: 2,
                    textAlign: "center",
                }}
            >
                <Container maxWidth="md">
                    <Typography
                        variant="h2"
                        fontWeight={700}
                        gutterBottom
                        sx={{
                            fontSize: { xs: "2.5rem", md: "3.5rem" },
                            color: "#2e1065"
                        }}
                    >
                        Create Engaging Quizzes with AI-Powered Generation
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            color: "#4a1a6b",
                            mb: 4,
                            fontSize: { xs: "1rem", md: "1.25rem" }
                        }}
                    >
                        Transform your ideas into interactive quizzes instantly with our AI-powered platform.
                        Perfect for educators, quiz hosts, and entertainment professionals.
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                        <Button
                            variant="contained"
                            size="large"
                            href="/auth/sign-up"
                            sx={{
                                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                                color: "#fff",
                                px: 4,
                                py: 1.5,
                                fontSize: "1.1rem",
                                fontWeight: 600,
                                borderRadius: 3,
                                textTransform: "none",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #6d28d9 0%, #9333ea 100%)",
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 6px 20px rgba(124, 58, 237, 0.4)",
                                }
                            }}
                        >
                            Get Started Free
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            href="/auth/sign-in"
                            sx={{
                                color: "#7c3aed",
                                borderColor: "#7c3aed",
                                px: 4,
                                py: 1.5,
                                fontSize: "1.1rem",
                                fontWeight: 600,
                                borderRadius: 3,
                                borderWidth: 2,
                                textTransform: "none",
                                backgroundColor: "rgba(255, 255, 255, 0.8)",
                                "&:hover": {
                                    borderWidth: 2,
                                    borderColor: "#6d28d9",
                                    backgroundColor: "rgba(255, 255, 255, 1)",
                                }
                            }}
                        >
                            Sign In
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* Features */}
            <Box sx={{ py: { xs: 8, md: 12 }, px: 2, bgcolor: "rgba(255, 255, 255, 0.5)" }}>
                <Container maxWidth="lg">
                    <Typography
                        variant="h4"
                        fontWeight={700}
                        textAlign="center"
                        gutterBottom
                        sx={{ color: "#2e1065", fontSize: { xs: "2rem", md: "2.5rem" } }}
                    >
                        Powerful Features
                    </Typography>
                    <Typography
                        variant="body1"
                        textAlign="center"
                        sx={{ mb: 6, color: "#4a1a6b", fontSize: "1.1rem" }}
                    >
                        Everything you need to create and manage engaging quizzes
                    </Typography>
                    <Grid container spacing={4}>
                        {features.map((feature) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.title}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: "100%",
                                        border: "none",
                                        borderRadius: 4,
                                        p: 2,
                                        backgroundColor: "white",
                                        transition: "transform 0.3s, box-shadow 0.3s",
                                        "&:hover": {
                                            transform: "translateY(-5px)",
                                            boxShadow: "0 8px 30px rgba(124, 58, 237, 0.2)",
                                        }
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ mb: 2, fontSize: "3rem" }}>{feature.icon}</Box>
                                        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: "#2e1065" }}>
                                            {feature.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "#6b21a8" }}>
                                            {feature.description}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* How It Works */}
            <Box sx={{ py: { xs: 8, md: 12 }, px: 2, bgcolor: "rgba(255, 255, 255, 0.3)" }}>
                <Container maxWidth="md">
                    <Typography
                        variant="h4"
                        fontWeight={700}
                        textAlign="center"
                        gutterBottom
                        sx={{ color: "#2e1065", fontSize: { xs: "2rem", md: "2.5rem" } }}
                    >
                        How It Works
                    </Typography>
                    <Typography
                        variant="body1"
                        textAlign="center"
                        sx={{ mb: 6, color: "#4a1a6b", fontSize: "1.1rem" }}
                    >
                        Create engaging quizzes in 3 simple steps
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {steps.map((step) => (
                            <Box key={step.number} sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: "50%",
                                        background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        fontWeight: 700,
                                        fontSize: "1.5rem",
                                        flexShrink: 0,
                                    }}
                                >
                                    {step.number}
                                </Box>
                                <Box>
                                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: "#2e1065" }}>
                                        {step.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "#6b21a8" }}>
                                        {step.description}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* Testimonials */}
            <Box sx={{ py: { xs: 8, md: 12 }, px: 2, bgcolor: "rgba(255, 255, 255, 0.5)" }}>
                <Container maxWidth="lg">
                    <Typography
                        variant="h4"
                        fontWeight={700}
                        textAlign="center"
                        gutterBottom
                        sx={{ color: "#2e1065", fontSize: { xs: "2rem", md: "2.5rem" } }}
                    >
                        Loved by Quiz Hosts Worldwide
                    </Typography>
                    <Typography
                        variant="body1"
                        textAlign="center"
                        sx={{ mb: 6, color: "#4a1a6b", fontSize: "1.1rem" }}
                    >
                        See what our users are saying about QuizMaster
                    </Typography>
                    <Grid container spacing={4}>
                        {testimonials.map((t) => (
                            <Grid size={{ xs: 12, md: 4 }} key={t.name}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: "100%",
                                        border: "none",
                                        borderRadius: 4,
                                        p: 2,
                                        backgroundColor: "white",
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="body1" sx={{ mb: 3, fontStyle: "italic", color: "#4a1a6b" }}>
                                            &ldquo;{t.quote}&rdquo;
                                        </Typography>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#2e1065" }}>
                                            {t.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: "#6b21a8" }}>
                                            {t.role}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>
            {/* Footer */}
            <Box
                sx={{
                    py: 6,
                    px: 2,
                    bgcolor: "#1a1a2e",
                    color: "#fff"
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={4}>
                        {/* Brand */}
                        <Grid size={{ xs: 12, md: 3 }}>
                            <Typography
                                variant="h5"
                                fontWeight={700}
                                gutterBottom
                                sx={{ color: "#fff" }}
                            >
                                Quizzp
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 2 }}
                            >
                                AI-powered quiz generation platform for educators and quiz hosts worldwide.
                            </Typography>
                            {/* Social Icons */}
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <a href="#" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                                </a>
                                <a href="#" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                </a>
                                <a href="#" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                                </a>
                                <a href="#" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                                </a>
                            </Box>
                        </Grid>

                        {/* Product */}
                        <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Product
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <a href="#" style={{ color: "rgba(255, 255, 255, 0.7)", textDecoration: "none" }}>Features</a>
                                <a href="#" style={{ color: "rgba(255, 255, 255, 0.7)", textDecoration: "none" }}>Pricing</a>
                                <a href="#" style={{ color: "rgba(255, 255, 255, 0.7)", textDecoration: "none" }}>AI Gen</a>
                            </Box>
                        </Grid>

                        {/* Support */}
                        <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Support
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <a href="#" style={{ color: "rgba(255, 255, 255, 0.7)", textDecoration: "none" }}>Help</a>
                                <a href="#" style={{ color: "rgba(255, 255, 255, 0.7)", textDecoration: "none" }}>Docs</a>
                                <a href="#" style={{ color: "rgba(255, 255, 255, 0.7)", textDecoration: "none" }}>FAQs</a>
                            </Box>
                        </Grid>

                        {/* Resources */}
                        <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Resources
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <a href="#" style={{ color: "rgba(255, 255, 255, 0.7)", textDecoration: "none" }}>Cookies policy</a>
                                <a href="#" style={{ color: "rgba(255, 255, 255, 0.7)", textDecoration: "none" }}>Privacy policy</a>
                                <a href="#" style={{ color: "rgba(255, 255, 255, 0.7)", textDecoration: "none" }}>Terms and conditions</a>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Copyright */}
                    <Box sx={{ mt: 6, pt: 3, borderTop: "1px solid rgba(255, 255, 255, 0.1)", textAlign: "center" }}>
                        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
                            © 2026 Quizzp. All rights reserved.
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}

export default App;