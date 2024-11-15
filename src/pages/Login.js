import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Avatar, Box, Button, CircularProgress, Paper, TextField } from "@mui/material";
import { Typography } from "@mui/material";

import EZlogo from "../assets/EZpresta-logo.png";
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
      navigate("/dashboard"); // Redirige vers le tableau de bord si déjà connecté
    }
  }, [currentUser, navigate]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      enqueueSnackbar("Connexion réussie", { variant: "success" });
    } catch (error) {
      if (error.message.includes("auth/email-not-verified")) {
        enqueueSnackbar("Votre compte doit être validé par email.", { variant: "warning" });
      } else {
        enqueueSnackbar("Erreur de connexion : " + error.message, { variant: "error" });
      }
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
          <Typography component="h1" variant="h5">Se connecter</Typography>
        </Box>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
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
            {loading ? <CircularProgress size={24} /> : "SE CONNECTER"}
          </Button>
          <Link to="/register">
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 1, bgcolor: "#388e3c" }}
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
