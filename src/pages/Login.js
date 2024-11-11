// src/pages/Login.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography
} from "@mui/material";

import EZlogo from "../assets/EZpresta-logo.png"; // Importer l'image du logo
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const { login, currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard"); // Rediriger vers le tableau de bord après connexion
    }
  }, [currentUser, navigate]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      enqueueSnackbar("Logged in successfully", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Failed to log in: " + error.message, {
        variant: "error"
      });
    }
    setLoading(false);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      bgcolor="#f5f5f5"
    >
      <Paper elevation={ 3 } sx={ { padding: 4, maxWidth: 400 } }>
        <Box display="flex" flexDirection="column" alignItems="center">

          <img src={EZlogo} alt="Ez Presta" style={{ width: "300px", marginBottom: "16px" }} />

          <Avatar sx={ { m: 1, bgcolor: "secondary.main" } }>
            <LockOutlinedIcon />
          </Avatar>
        </Box>
        <Box component="form" onSubmit={ handleSubmit } sx={ { mt: 1 } }>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email"
            type="email"
            value={ email }
            onChange={ e => setEmail(e.target.value) }
            autoComplete="email"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Mot de passe"
            type="password"
            value={ password }
            onChange={ e => setPassword(e.target.value) }
            autoComplete="current-password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={ { mt: 3, mb: 2, bgcolor: "#d32f2f" } }
            disabled={ loading }
          >
            { loading ? <CircularProgress size={ 24 } /> : "SE CONNECTER" }
          </Button>
          <Link to="/register">
            <Button
              fullWidth
              variant="contained"
              sx={ { mt: 1, mb: 2, bgcolor: "#388e3c" } }
            >
              CRÉER VOTRE COMPTE
            </Button>
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
