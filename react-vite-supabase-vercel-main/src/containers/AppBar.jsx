import { useState, memo } from "react";
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

import { useAuth } from "../hooks/useAuth";

const pages = [
  { pageName: "Home", link: "/", protected: null },
  { pageName: "Features", link: "/#features", protected: null },
  { pageName: "Pricing", link: "/#pricing", protected: null },
  { pageName: "Sign In", link: "/auth/sign-in", protected: false },
];

function ResponsiveAppBar() {
  const { session, loading } = useAuth();

  const [anchorElNav, setAnchorElNav] = useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  if (loading) {
    return null;
  }

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
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
            {pages.map((page) => {
              if (
                page.protected === null ||
                (page.protected === false && !session) ||
                (page.protected === true && session)
              ) {
                return (
                  <Button
                    key={page.pageName}
                    href={page.link}
                    onClick={handleCloseNavMenu}
                    sx={{ color: "#000", fontWeight: 500 }}
                  >
                    {page.pageName}
                  </Button>
                );
              }
              return null;
            })}
          </Box>

          {/* Mobile hamburger */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
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
              {pages.map((page) => {
                if (
                  page.protected === null ||
                  (page.protected === false && !session) ||
                  (page.protected === true && session)
                ) {
                  return (
                    <MenuItem key={page.pageName} onClick={handleCloseNavMenu}>
                      <Link
                        href={page.link}
                        sx={{ textDecoration: "none", color: "inherit" }}
                      >
                        {page.pageName}
                      </Link>
                    </MenuItem>
                  );
                }
                return null;
              })}
            </Menu>
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default memo(ResponsiveAppBar);
