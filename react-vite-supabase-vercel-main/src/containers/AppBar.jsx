import { useState, memo } from "react";
import { useNavigate } from "react-router";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";

import { useAuth } from "../hooks/useAuth";
import supabase from "../utils/supabase";

const pages = [
    { pageName: "Home", link: "/" },
    { pageName: "Features", link: "/#features" },
    { pageName: "Pricing", link: "/#pricing" },
];

function ResponsiveAppBar() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [anchorElNav, setAnchorElNav] = useState(null);
    const [anchorElUser, setAnchorElUser] = useState(null);

    const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
    const handleCloseNavMenu = () => setAnchorElNav(null);
    const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
    const handleCloseUserMenu = () => setAnchorElUser(null);

    const handleDashboard = () => {
        navigate('/dashboard');
        handleCloseUserMenu();
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
        handleCloseUserMenu();
    };

    if (loading) return null;

    const displayName = user?.user_metadata?.name || user?.email;

    return (
        <AppBar position="static" sx={{ bgcolor: "#fff", color: "#000" }} elevation={1}>
            <Container>
                <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>

                    {/* Brand */}
                    <Typography
                        variant="h6"
                        fontWeight={800}
                        component="a"
                        href="/"
                        sx={{ textDecoration: "none", color: "primary.main", letterSpacing: 1 }}
                    >
                        Quizzp
                    </Typography>

                    {/* Desktop nav */}
                    <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1, alignItems: "center" }}>
                        {pages.map((page) => (
                            <Button
                                key={page.pageName}
                                href={page.link}
                                onClick={handleCloseNavMenu}
                                sx={{ color: "#000", fontWeight: 500 }}
                            >
                                {page.pageName}
                            </Button>
                        ))}

                        {user ? (
                            <>
                                <IconButton onClick={handleOpenUserMenu} sx={{ ml: 2 }}>
                                    <Avatar sx={{ bgcolor: '#7c3aed', width: 40, height: 40, fontWeight: 600, fontSize: '1rem' }}>
                                        {displayName?.charAt(0).toUpperCase()}
                                    </Avatar>
                                </IconButton>
                                <Menu
                                    anchorEl={anchorElUser}
                                    open={Boolean(anchorElUser)}
                                    onClose={handleCloseUserMenu}
                                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                                >
                                    <MenuItem disabled>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{displayName}</Typography>
                                            <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                                        </Box>
                                    </MenuItem>
                                    <MenuItem onClick={handleDashboard}>Dashboard</MenuItem>
                                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                href="/auth/sign-in"
                                sx={{
                                    ml: 2,
                                    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    px: 3,
                                    '&:hover': { background: 'linear-gradient(135deg, #6d28d9 0%, #9333ea 100%)' }
                                }}
                            >
                                Sign In
                            </Button>
                        )}
                    </Box>

                    {/* Mobile hamburger */}
                    <Box sx={{ display: { xs: "flex", md: "none" } }}>
                        <IconButton size="large" aria-label="menu" onClick={handleOpenNavMenu} color="inherit">
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElNav}
                            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            keepMounted
                            transformOrigin={{ vertical: "top", horizontal: "right" }}
                            open={Boolean(anchorElNav)}
                            onClose={handleCloseNavMenu}
                            sx={{ display: { xs: "block", md: "none" } }}
                        >
                            {pages.map((page) => (
                                <MenuItem key={page.pageName} onClick={handleCloseNavMenu}>
                                    <Link href={page.link} sx={{ textDecoration: "none", color: "inherit" }}>
                                        {page.pageName}
                                    </Link>
                                </MenuItem>
                            ))}
                            {user ? (
                                <>
                                    <MenuItem onClick={handleDashboard}>Dashboard</MenuItem>
                                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                                </>
                            ) : (
                                <MenuItem onClick={() => navigate('/auth/sign-in')}>Sign In</MenuItem>
                            )}
                        </Menu>
                    </Box>

                </Toolbar>
            </Container>
        </AppBar>
    );
}

export default memo(ResponsiveAppBar);
