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
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>
        {customerId ? "Edit Customer" : "Create Customer"}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="firstname"
          label="First Name"
          type="text"
          fullWidth
          value={formData.firstname}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="email"
          label="Email"
          type="email"
          fullWidth
          value={formData.email}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="phone"
          label="Phone"
          type="tel"
          fullWidth
          value={formData.phone}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="userAddress"
          label="Address"
          type="text"
          fullWidth
          value={formData.userAddress}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="userNote"
          label="Note"
          type="text"
          fullWidth
          value={formData.userNote}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="company"
          label="Company"
          type="text"
          fullWidth
          value={formData.company}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="source"
          label="Source"
          type="text"
          fullWidth
          value={formData.source}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="sourceOther"
          label="Source Other"
          type="text"
          fullWidth
          value={formData.sourceOther}
          onChange={handleChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerForm;
