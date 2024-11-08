// src/components/ProductForm.js
import React, { useEffect, useState } from "react";
import { useSnackbar } from "notistack";

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  TextField
} from "@mui/material";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

import { db } from "../firebase";
import { getDuration, getFormattedDuration } from "./utils";

const colors = [
  { name: "Rouge", value: "#ff0000" },
  { name: "Gris", value: "#808080" },
  { name: "Vert", value: "#008000" },
  { name: "Bleu", value: "#0000ff" },
  { name: "Noir", value: "#000000" },
  { name: "Orange", value: "#ffa500" },
  { name: "Jaune", value: "#ffff00" },
  { name: "Violet", value: "#800080" }
];

const ProductForm = ({ open, handleClose, productId, userId, onSave }) => {
  const [formData, setFormData] = useState({
    id: "",
    type: "",
    name: "",
    description: "",
    duration: "",
    price: 0,
    color: "",
    payableOnline: false,
    bookableOnline: false,
    payableInInstallments: false,
    payableInInstallments2x: false
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchProduct = async () => {
      if (productId && userId) {
        setLoading(true);
        const productDoc = doc(db, `users/${userId}/catalog`, productId);
        const docSnap = await getDoc(productDoc);
        if (docSnap.exists()) {
          setFormData({ ...docSnap.data(), id: productId });
        }
        setLoading(false);
      } else {
        setFormData({
          id: "",
          type: "",
          title: "",
          description: "",
          duration: "",
          price: 0,
          color: "",
          payableOnline: false,
          bookableOnline: false,
          payableInInstallments: false,
          payableInInstallments2x: false
        });
      }
    };

    const fetchCategories = async () => {
      if (userId) {
        const categoriesRef = collection(db, `users/${userId}/categories`);
        const snapshot = await getDocs(categoriesRef);
        const categoriesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesList);
      }
    };

    fetchProduct();
    fetchCategories();
  }, [productId, userId]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (userId) {
      setLoading(true);
      const newProductId = productId || new Date().getTime().toString();
      const productRef = doc(db, `users/${userId}/catalog`, newProductId);
      try {
        await setDoc(
          productRef,
          { ...formData, id: newProductId },
          { merge: true }
        );
        enqueueSnackbar("Product saved successfully", { variant: "success" });
        onSave({ ...formData, id: newProductId });
        handleClose();
      } catch (error) {
        enqueueSnackbar("Error saving product: " + error.message, {
          variant: "error"
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
    <Dialog open={ open } onClose={ handleClose } maxWidth="md" fullWidth>
      <DialogTitle>
        { productId ? "Modifier le produit" : "Ajouter un nouveau produit" }
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={ handleSubmit } sx={ { mt: 2 } }>
          <Grid container spacing={ 2 }>
            <Grid item xs={ 12 } sm={ 6 }>
              <TextField
                select
                label="Type"
                name="type"
                value={ formData.type }
                onChange={ handleChange }
                fullWidth
                required
              >
                { categories.map(category => (
                  <MenuItem key={ category.id } value={ category.name }>
                    { category.name }
                  </MenuItem>
                )) }
              </TextField>
            </Grid>
            <Grid item xs={ 12 } sm={ 6 }>
              <TextField
                label="Prix"
                name="price"
                type="number"
                value={ formData.price }
                onChange={ handleChange }
                fullWidth
                required
                InputProps={ {
                  startAdornment: <span>€</span>
                } }
              />
            </Grid>
            <Grid item xs={ 12 } sm={ 6 }>
              <TextField
                label="Titre"
                name="name"
                value={ formData.name }
                onChange={ handleChange }
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={ 12 } sm={ 6 }>
              <TextField
                label="Description"
                name="description"
                value={ formData.description }
                onChange={ handleChange }
                fullWidth
              />
            </Grid>
            <Grid item xs={ 12 } sm={ 6 }>
              <TextField
                select
                label="Durée"
                name="duration"
                value={ getFormattedDuration(formData.duration) }
                onChange={ handleChange }
                fullWidth
              >
                { getDuration().map(duration => (
                  <MenuItem key={ duration.id } value={ duration.name }>
                    { duration.name }
                  </MenuItem>
                )) }
              </TextField>
            </Grid>
            <Grid item xs={ 12 } sm={ 6 }>
              <TextField
                select
                label="Couleur"
                name="color"
                value={ formData.color }
                onChange={ handleChange }
                fullWidth
              >
                { colors.map(color => (
                  <MenuItem key={ color.value } value={ color.value }>
                    <Box
                      component="span"
                      sx={ {
                        display: "inline-block",
                        width: 20,
                        height: 20,
                        backgroundColor: color.value,
                        marginRight: 1
                      } }
                    />
                    { color.name }
                  </MenuItem>
                )) }
              </TextField>
            </Grid>
            <Grid item xs={ 12 }>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={ formData.payableOnline }
                    onChange={ handleChange }
                    name="payableOnline"
                  />
                }
                label="Payable en ligne"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={ formData.bookableOnline }
                    onChange={ handleChange }
                    name="bookableOnline"
                  />
                }
                label="Réservable en ligne"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={ formData.payableInInstallments }
                    onChange={ handleChange }
                    name="payableInInstallments"
                  />
                }
                label="Payable en 3x fois"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={ formData.payableInInstallments2x }
                    onChange={ handleChange }
                    name="payableInInstallments2x"
                  />
                }
                label="Payable en 2x fois"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={ handleClose } color="secondary">
          Annuler
        </Button>
        <Button onClick={ handleSubmit } color="primary" disabled={ loading }>
          Valider
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductForm;
