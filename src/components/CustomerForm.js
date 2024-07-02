// src/components/CustomerForm.js
import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useSnackbar } from "notistack";

const CustomerForm = ({ open, handleClose, customerId, userId, onSave }) => {
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
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchCustomer = async () => {
      if (customerId && userId) {
        setLoading(true);
        const customerDoc = doc(db, `users/${userId}/customers`, customerId);
        const docSnap = await getDoc(customerDoc);
        if (docSnap.exists()) {
          setFormData(docSnap.data());
        }
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId, userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (userId) {
      setLoading(true);
      const customerRef = doc(
        db,
        `users/${userId}/customers`,
        customerId || new Date().getTime().toString()
      );
      try {
        await setDoc(customerRef, formData, { merge: true });
        enqueueSnackbar("Customer saved successfully", { variant: "success" });
        const customersRef = collection(db, `users/${userId}/customers`);
        const snapshot = await getDocs(customersRef);
        const customersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        onSave(customersList);
        handleClose();
      } catch (error) {
        enqueueSnackbar("Error saving customer: " + error.message, {
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
              <TextField
                margin="normal"
                fullWidth
                label="Source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                sx={{ "& .MuiInputBase-input": { fontSize: "16px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                fullWidth
                label="Source Other"
                name="sourceOther"
                value={formData.sourceOther}
                onChange={handleChange}
                sx={{ "& .MuiInputBase-input": { fontSize: "16px" } }}
              />
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
