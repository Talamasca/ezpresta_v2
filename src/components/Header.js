// src/components/Header.js
import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Switch,
  Button,
  Box,
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Header = ({ toggleTheme, darkMode }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      // Handle error if needed
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
          <img
            src="path_to_logo"
            alt="EzPresta Logo"
            style={{ height: 40, marginRight: 16 }}
          />
          <Typography variant="h6" component="div">
            EzPresta
          </Typography>
        </Box>
        <Switch checked={darkMode} onChange={toggleTheme} />
        {currentUser && (
          <Box display="flex" alignItems="center">
            <Typography variant="body1" component="div" sx={{ marginRight: 2 }}>
              {currentUser.displayName || currentUser.email}
            </Typography>
            <IconButton edge="end" color="inherit">
              <AccountCircle />
            </IconButton>
            <Button color="inherit" onClick={handleLogout}>
              Déconnexion
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
