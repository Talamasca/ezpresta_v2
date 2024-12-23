// src/components/CategoryManager.js
import React, { useEffect, useState } from "react";
import { useSnackbar } from "notistack";

import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from "@mui/material";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc
} from "firebase/firestore";

import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";

const CategoryManager = ({ open, handleClose }) => {
  const { currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      if (currentUser) {
        try {
          const categoriesRef = collection(
            db,
            `users/${currentUser.uid}/categories`
          );
          const snapshot = await getDocs(categoriesRef);
          const categoriesList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCategories(categoriesList);
        } catch (error) {
          enqueueSnackbar("Error fetching categories: " + error.message, {
            variant: "error"
          });
        }
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [currentUser, open, enqueueSnackbar]);

  const handleAddCategory = async () => {
    if (!newCategory) return;
    try {
      const categoriesRef = collection(
        db,
        `users/${currentUser.uid}/categories`
      );
      const docRef = await addDoc(categoriesRef, { name: newCategory });
      setCategories([...categories, { id: docRef.id, name: newCategory }]);
      setNewCategory("");
      enqueueSnackbar("Catégorie ajoutée avec succès", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Error adding category: " + error.message, {
        variant: "error"
      });
    }
  };

  const handleEditCategory = async (id, name) => {
    try {
      const categoryDoc = doc(db, `users/${currentUser.uid}/categories`, id);
      await updateDoc(categoryDoc, { name });
      setCategories(
        categories.map(category =>
          category.id === id ? { id, name } : category
        )
      );
      setEditingCategory(null);
      enqueueSnackbar("Catégorie mise à jour avec succès", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Error updating category: " + error.message, {
        variant: "error"
      });
    }
  };

  const handleDeleteCategory = async id => {
    try {
      const categoryDoc = doc(db, `users/${currentUser.uid}/categories`, id);
      await deleteDoc(categoryDoc);
      setCategories(categories.filter(category => category.id !== id));
      enqueueSnackbar("Catégorie effacée avec succès", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Error deleting category: " + error.message, {
        variant: "error"
      });
    }
  };

  return (
    <Dialog open={ open } onClose={ handleClose } maxWidth="sm" fullWidth>
      <DialogTitle>Gérer les catégories</DialogTitle>
      <DialogContent>
        <Box display="flex" alignItems="center" mb={ 2 }>
          <TextField
            label="Ajouter une catégorie"
            value={ newCategory }
            onChange={ e => setNewCategory(e.target.value) }
            fullWidth
          />
          <IconButton color="primary" onClick={ handleAddCategory }>
            <SaveIcon />
          </IconButton>
        </Box>
        <TableContainer component={ Paper }>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Action(s)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              { categories.map((category, index) => (
                <TableRow key={ category.id }>
                  <TableCell>{ index + 1 }</TableCell>
                  <TableCell>
                    { editingCategory === category.id ? (
                      <TextField
                        value={ category.name }
                        onChange={ e =>
                          setCategories(
                            categories.map(cat =>
                              cat.id === category.id
                                ? { ...cat, name: e.target.value }
                                : cat
                            ))
                        }
                      />
                    ) : (
                      category.name
                    ) }
                  </TableCell>
                  <TableCell>
                    { editingCategory === category.id ? (
                      <>
                        <IconButton
                          onClick={ () =>
                            handleEditCategory(category.id, category.name)
                          }
                        >
                          <SaveIcon />
                        </IconButton>
                        <IconButton onClick={ () => setEditingCategory(null) }>
                          <Button color="secondary">Annuler</Button>
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          onClick={ () => setEditingCategory(category.id) }
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={ () => handleDeleteCategory(category.id) }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    ) }
                  </TableCell>
                </TableRow>
              )) }
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={ handleClose } color="primary">
          Annuler
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryManager;
