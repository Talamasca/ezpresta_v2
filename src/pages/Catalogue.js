import React, { useEffect, useState } from "react";
import { useSnackbar } from "notistack";

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon
} from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Fab,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";

import CategoryManager from "../components/CategoryManager";
import ProductForm from "../components/ProductForm";
import { getFormattedDuration, price } from "../components/utils";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";

const Catalogue = () => {
  const { currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      if (currentUser) {
        try {
          const catalogRef = collection(db, `users/${currentUser.uid}/catalog`);
          const snapshot = await getDocs(catalogRef);
          const catalogList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCatalog(catalogList);
          setLoading(false);
        } catch (error) {
          enqueueSnackbar("Error fetching catalog: " + error.message, {
            variant: "error"
          });
          setLoading(false);
        }
      }
    };

    fetchCatalog();
  }, [currentUser, enqueueSnackbar]);

  const handleSearchChange = event => {
    setSearch(event.target.value);
  };

  const handleOpenForm = (product, productId = null) => {
    setSelectedProduct(product);
    setSelectedProductId(productId);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedProduct(null);
    setSelectedProductId(null);
  };

  const handleSaveProduct = savedProduct => {
    const updatedCatalog = [...catalog];
    const productIndex = updatedCatalog.findIndex(
      product => product.id === savedProduct.id
    );

    if (productIndex >= 0) {
      updatedCatalog[productIndex] = savedProduct;
    } else {
      updatedCatalog.push(savedProduct);
    }

    setCatalog(updatedCatalog);
    handleCloseForm();
  };

  const handleDeleteProduct = async productId => {
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/catalog`, productId));
      setCatalog(catalog.filter(product => product.id !== productId));
      enqueueSnackbar("Product deleted successfully", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Error deleting product: " + error.message, {
        variant: "error"
      });
    }
  };

  const filteredCatalog = catalog.filter(
    item =>
      (item.type && item.type.toLowerCase().includes(search.toLowerCase())) ||
      (item.name && item.name.toLowerCase().includes(search.toLowerCase())) ||
      (item.description &&
        item.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <Box
        sx={ {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh"
        } }
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={ { my: 2 } }
      >
        <Fab
          variant="extended"
          color="primary"
          aria-label="add"
          sx={ { marginRight: 2 } }
          onClick={ () => handleOpenForm(null, null) }
        >
          <AddIcon sx={ { mr: 1 } } />
          Ajouter un produit
        </Fab>
        <Fab
          variant="extended"
          color="primary"
          aria-label="manage"
          onClick={ () => {
            setCategoryManagerOpen(true);
          } }
        >
          <AddIcon sx={ { mr: 1 } } />
          Gérer les catégories
        </Fab>
      </Box>
      <Typography
        variant="h4"
        sx={ {
          margin: theme => theme.spacing(4, 0, 2),
          textAlign: "center",
          fontWeight: "bold"
        } }
      >
        Catalogue
      </Typography>
      <Box display="flex" justifyContent="flex-end" sx={ { mb: 2 } }>
        <TextField
          variant="outlined"
          placeholder="Search..."
          value={ search }
          onChange={ handleSearchChange }
          InputProps={ {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          } }
          sx={ { width: 300 } }
        />
      </Box>
      <TableContainer
        component={ Paper }
        sx={ { marginTop: theme => theme.spacing(4) } }
      >
        <Table sx={ { minWidth: 650 } }>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Titre</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Durée</TableCell>
              <TableCell>Prix</TableCell>
              <TableCell>Option(s)</TableCell>
              <TableCell>Action(s)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            { filteredCatalog.map(item => (
              <TableRow key={ item.id }>
                <TableCell>{ item.type }</TableCell>
                <TableCell>{ item.name }</TableCell>
                <TableCell>{ item.description }</TableCell>
                <TableCell>{ getFormattedDuration(item.duration) }</TableCell>
                <TableCell>{ price(item.price) }</TableCell>
                <TableCell>{ item.options }</TableCell>
                <TableCell>
                  <IconButton onClick={ () => handleOpenForm(item, item.id) }>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={ () => handleDeleteProduct(item.id) }>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            )) }
          </TableBody>
        </Table>
      </TableContainer>

      <ProductForm
        open={ formOpen }
        handleClose={ handleCloseForm }
        productId={ selectedProductId }
        userId={ currentUser.uid }
        onSave={ handleSaveProduct }
      />

      <CategoryManager
        open={ categoryManagerOpen }
        handleClose={ () => setCategoryManagerOpen(false) }
      />
    </>
  );
};

export default Catalogue;
