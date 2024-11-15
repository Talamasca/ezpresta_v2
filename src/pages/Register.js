// Register.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import { LockOutlined as LockOutlinedIcon } from "@mui/icons-material";
import { Avatar, Box, Button, CircularProgress, Paper, TextField, Typography } from "@mui/material";

import EZlogo from "../assets/EZpresta-logo.png";
import { useAuth } from "../contexts/AuthContext";

const Register = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleRegister = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      // Appel de signup avec email, password et username
      await signup(email, password, username);

      enqueueSnackbar("Votre compte a été créé. Veuillez vérifier votre email pour activer votre compte.", { variant: "success" });
      navigate("/login");
    } catch (error) {
      enqueueSnackbar("Erreur lors de la création de compte : " + error.message, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" bgcolor="#f5f5f5">
      <Paper elevation={3} sx={{ padding: 4, maxWidth: 400 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <img src={EZlogo} alt="Ez Presta" style={{ width: "300px", marginBottom: "16px" }} />
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">Créer votre compte</Typography>
        </Box>
        <Box component="form" onSubmit={handleRegister} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Nom d'utilisateur"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Mot de passe"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "CRÉER MON COMPTE"}
          </Button>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 1, bgcolor: "#388e3c" }}
            onClick={() => navigate("/login")}
          >
            J&apos;AI DÉJÀ UN COMPTE
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;
