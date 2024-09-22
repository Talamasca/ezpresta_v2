// src/components/CustomerForm.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Grid,
  Select,
  MenuItem,
} from "@mui/material";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useSnackbar } from "notistack";
import validator from "validator";

const CustomerForm = ({ open, handleClose, customerId, userId, onSave }) => {
  const { currentUser } = useAuth();

  if (!userId) {
    userId = currentUser.uid;
  }

  const [formData, setFormData] = useState({
    firstname: "",
    email: "",
    phone: "",
    userAddress: "",
    userNote: "",
    company: "",
    source: "",
    sourceOther: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { enqueueSnackbar } = useSnackbar();
  const [sources, setSources] = useState([]);

  useEffect(() => {
    if (!customerId) {
      // Si customerId est null, réinitialisez le formulaire pour un nouveau client
      setFormData({
        firstname: "",
        email: "",
        phone: "",
        userAddress: "",
        userNote: "",
        company: "",
        source: "",
        sourceOther: "",
      });
    } else {
      // Charger les données du client existant
      const fetchCustomer = async () => {
        setLoading(true);
        const customerDoc = doc(db, `users/${userId}/customers`, customerId);
        const docSnap = await getDoc(customerDoc);
        if (docSnap.exists()) {
          setFormData(docSnap.data());
        }
        setLoading(false);
      };

      fetchCustomer();
    }
  }, [customerId, userId]);

  useEffect(() => {
    const fetchSources = async () => {
      if (userId) {
        const sourcesCollection = collection(
          db,
          `users/${userId}/customerSource`
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
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Clear errors on change
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
    //
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
      sourceOther: value === "other" ? prevData.sourceOther : "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstname.trim())
      newErrors.firstname = "First name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      if (!validator.isEmail(formData.email))
        newErrors.email = "Email is not valid";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      if (!validator.isMobilePhone(formData.phone, "any", { strictMode: true }))
        newErrors.phone = "Phone number is not valid";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (userId) {
      setLoading(true);
      const newCustomerId = customerId || new Date().getTime().toString();
      const customerRef = doc(db, `users/${userId}/customers`, newCustomerId);

      try {
        await setDoc(customerRef, formData, { merge: true });
        enqueueSnackbar("Client sauvegardé avec succès", {
          variant: "success",
        });

        // Créer le nouveau client
        const newCustomer = { id: newCustomerId, ...formData };

        // Appeler onSave avec le nouveau client
        onSave(newCustomer); // Ne passe que le nouveau client à Reservation.js
        handleClose(); // Fermer le formulaire
      } catch (error) {
        enqueueSnackbar("Erreur lors de la sauvegarde : " + error.message, {
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {customerId ? "Edit Customer" : "Create Customer"}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="First Name"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                sx={{ "& .MuiInputBase-input": { fontSize: "16px" } }}
                helperText={errors["firstname"]}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                sx={{ "& .MuiInputBase-input": { fontSize: "16px" } }}
                helperText={errors["email"]}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                sx={{ "& .MuiInputBase-input": { fontSize: "16px" } }}
                helperText={errors["phone"]}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                fullWidth
                label="Company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                sx={{ "& .MuiInputBase-input": { fontSize: "16px" } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="normal"
                fullWidth
                label="Address"
                name="userAddress"
                value={formData.userAddress}
                onChange={handleChange}
                sx={{ "& .MuiInputBase-input": { fontSize: "16px" } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="normal"
                fullWidth
                label="Note"
                name="userNote"
                value={formData.userNote}
                onChange={handleChange}
                sx={{ "& .MuiInputBase-input": { fontSize: "16px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Select
                margin="normal"
                fullWidth
                label="Source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Sélectionner une provenance
                </MenuItem>
                {sources.map((source) => (
                  <MenuItem key={source.id} value={source.name}>
                    {source.name}
                  </MenuItem>
                ))}
                <MenuItem value="other">Autre</MenuItem>
              </Select>

              {formData.source === "other" && (
                <TextField
                  margin="normal"
                  fullWidth
                  label="Source (Autre)"
                  name="sourceOther"
                  value={formData.sourceOther}
                  onChange={handleChange}
                  sx={{ "& .MuiInputBase-input": { fontSize: "16px" } }}
                />
              )}
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" disabled={loading}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerForm;
