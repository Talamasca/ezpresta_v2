/*
### Explications des sections

1. **Informations personnelles** : Permet de changer le nom, l'email et le mot de passe. Le mot de passe nécessite la confirmation de l'ancien mot de passe.
2. **Informations de l'entreprise** : Permet de modifier les informations de l'entreprise telles que le nom, l'adresse, le SIRET, le site web et le téléphone.
3. **Coordonnées bancaires** : Permet de modifier les informations bancaires (BIC et IBAN).
4. **Paramètres** : Permet de modifier les numéros de factures et de devis. Ces champs sont désactivés si des valeurs sont déjà enregistrées.
5. **Logo** : Permet de changer le logo en uploadant une image. Les formats acceptés sont JPEG, PNG et GIF, avec une taille maximale de 350 ko.
*/

import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Paper,
  Avatar,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";

import { useSnackbar } from "notistack";
import validator from "validator";

const Settings = () => {
  const { currentUser, updateEmail, updatePassword, updateUserData } =
    useAuth();

  const { enqueueSnackbar } = useSnackbar();
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    newPassword: "",
    company: "",
    address: "",
    siret: "",
    url: "",
    phone: "",
    bic: "",
    iban: "",
    invoice: "",
    quote: "",
    logo: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [sources, setSources] = useState([]);
  const [newSource, setNewSource] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const userDoc = doc(db, `users/${currentUser.uid}`);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    const fetchSources = async () => {
      if (currentUser) {
        const sourcesCollection = collection(
          db,
          `users/${currentUser.uid}/customerSource`
        );
        const sourcesSnapshot = await getDocs(sourcesCollection);
        const sourcesList = sourcesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setSources(sourcesList);
      }
    };

    fetchSources();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
    // Reset errors on input change
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateIBAN = () => {
    if (!validator.isIBAN(userData.iban)) {
      setErrors((prev) => ({ ...prev, iban: "Invalid IBAN format" }));
      return false;
    }
    return true;
  };

  const validateBIC = () => {
    if (!validator.isBIC(userData.bic)) {
      setErrors((prev) => ({ ...prev, bic: "Invalid BIC format" }));
      return false;
    }
    return true;
  };

  const handleSaveIban = async () => {
    if (!validateIBAN()) {
      enqueueSnackbar("Il faut entrer un IBAN valide.", {
        variant: "error",
      });
      return;
    }

    if (!validateBIC()) {
      enqueueSnackbar("Il faut entrer un BIC valide.", {
        variant: "error",
      });
      return;
    }

    try {
      const userDoc = doc(db, `users/${currentUser.uid}`);
      await updateDoc(userDoc, { iban: userData.iban, bic: userData.bic });
      enqueueSnackbar("IBAN/BIC updated successfully", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(`Error updating IBAN: ${error.message}`, {
        variant: "error",
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (
      file &&
      file.size <= 350000 &&
      ["image/jpeg", "image/jpg", "image/png", "image/gif"].includes(file.type)
    ) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newLogo = reader.result;
        setUserData({ ...userData, logo: newLogo });
        setLogoFile(file);
        await updateUserData({ logo: newLogo });
        enqueueSnackbar("Logo updated successfully", { variant: "success" });
      };
      reader.readAsDataURL(file);
    } else {
      enqueueSnackbar("Invalid file format or size", { variant: "error" });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const userDoc = doc(db, `users/${currentUser.uid}`);
      await updateDoc(userDoc, userData);
      enqueueSnackbar("Settings updated successfully", { variant: "success" });

      if (userData.email !== currentUser.email) {
        await updateEmail(userData.email);
      }
      if (userData.newPassword) {
        await updatePassword(userData.newPassword);
      }
    } catch (error) {
      enqueueSnackbar(`Error updating settings: ${error.message}`, {
        variant: "error",
      });
    }
  };

  const handleFieldSave = async (field) => {
    try {
      const userDoc = doc(db, `users/${currentUser.uid}`);
      await updateDoc(userDoc, { [field]: userData[field] });
      enqueueSnackbar("Settings updated successfully", {
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar(`Error updating ${field}: ${error.message}`, {
        variant: "error",
      });
    }
  };

  const handleAddSource = async () => {
    if (newSource) {
      const sourcesCollection = collection(
        db,
        `users/${currentUser.uid}/customerSource`
      );
      await addDoc(sourcesCollection, { name: newSource });

      // Mettre à jour l'état local après ajout
      setSources([...sources, { id: Date.now().toString(), name: newSource }]);
      setNewSource(""); // Réinitialiser le champ d'ajout
    }
  };

  const handleDeleteSource = async (id) => {
    const sourceDoc = doc(db, `users/${currentUser.uid}/customerSource/${id}`);
    await deleteDoc(sourceDoc);

    // Mettre à jour l'état local après suppression
    setSources(sources.filter((source) => source.id !== id));
  };

  const handleUpdateSource = async (id, newSourceValue) => {
    const sourceDoc = doc(db, `users/${currentUser.uid}/customerSource/${id}`);
    await updateDoc(sourceDoc, { name: newSourceValue });

    // Mettre à jour l'état local après modification
    setSources(
      sources.map((source) =>
        source.id === id ? { ...source, name: newSourceValue } : source
      )
    );
  };

  return (
    <Container component="main" maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Réglages
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Changer vos informations personnelles
            </Typography>
            <Box
              component="form"
              onSubmit={handleSave}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="name"
                label="Nom"
                name="name"
                autoComplete="name"
                value={userData.name}
                onChange={handleInputChange}
                onBlur={() => handleFieldSave("name")}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                value={userData.email}
                onChange={handleInputChange}
                onBlur={() => handleFieldSave("email")}
              />
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                name="password"
                label="Ancien mot de passe"
                type="password"
                id="password"
                autoComplete="current-password"
                value={userData.password}
                onChange={handleInputChange}
              />
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                name="newPassword"
                label="Nouveau mot de passe"
                type="password"
                id="newPassword"
                value={userData.newPassword}
                onChange={handleInputChange}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2 }}
              >
                Sauvegarder
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Changer les informations de votre entreprise
            </Typography>
            <Box
              component="form"
              onSubmit={handleSave}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="company"
                label="Nom de l'entreprise"
                name="company"
                value={userData.company}
                onChange={handleInputChange}
                onBlur={() => handleFieldSave("company")}
              />
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="address"
                label="Adresse"
                name="address"
                value={userData.address}
                onChange={handleInputChange}
                onBlur={() => handleFieldSave("address")}
              />
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="siret"
                label="Siret"
                name="siret"
                value={userData.siret}
                onChange={handleInputChange}
                onBlur={() => handleFieldSave("siret")}
              />
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="url"
                label="Site Web"
                name="url"
                value={userData.url}
                onChange={handleInputChange}
                onBlur={() => handleFieldSave("url")}
              />
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="phone"
                label="Téléphone"
                name="phone"
                value={userData.phone}
                onChange={handleInputChange}
                onBlur={() => handleFieldSave("phone")}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pour personnaliser vos devis et factures
            </Typography>
            <Box
              component="form"
              onSubmit={handleSave}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="bic"
                label="Code BIC"
                name="bic"
                value={userData.bic}
                error={!!errors.bic}
                helperText={errors.bic}
                onChange={handleInputChange}
              />
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="iban"
                label="IBAN"
                name="iban"
                value={userData.iban}
                error={!!errors.iban}
                helperText={errors.iban}
                onChange={handleInputChange}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2 }}
                onClick={handleSaveIban}
              >
                Sauvegarder
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personnaliser votre interface, vos factures et devis
            </Typography>
            <Box
              component="form"
              onSubmit={handleSave}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="invoice"
                label="Numéro de Facture"
                name="invoice"
                value={userData.invoice}
                onChange={handleInputChange}
                disabled={Boolean(userData.invoice)}
              />
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="quote"
                label="Numéro de Devis"
                name="quote"
                value={userData.quote}
                onChange={handleInputChange}
                disabled={Boolean(userData.quote)}
              />
              {Boolean(userData.invoice) && Boolean(userData.quote) && (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mt: 2 }}
                >
                  Pour des raisons légales, vous ne pouvez plus éditer vos
                  numéros de facture et devis
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personnaliser votre interface
            </Typography>
            <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
              <Avatar
                src={userData.logo}
                alt="Logo"
                sx={{ width: 80, height: 80, marginRight: 2 }}
              />
              <input
                accept="image/jpeg, image/png, image/gif"
                style={{ display: "none" }}
                id="raised-button-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="raised-button-file">
                <Button variant="contained" color="primary" component="span">
                  Changer de logo
                </Button>
              </label>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Gérer les provenances de contact
            </Typography>
            <Box sx={{ mt: 2 }}>
              {sources.map((source) => (
                <Box
                  key={source.id}
                  sx={{ display: "flex", alignItems: "center", mb: 2 }}
                >
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={source.name}
                    onChange={(e) =>
                      handleUpdateSource(source.id, e.target.value)
                    }
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleDeleteSource(source.id)}
                    sx={{ ml: 2 }}
                  >
                    Supprimer
                  </Button>
                </Box>
              ))}

              <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Ajouter une provenance"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddSource}
                  sx={{ ml: 2 }}
                >
                  Ajouter
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
export default Settings;