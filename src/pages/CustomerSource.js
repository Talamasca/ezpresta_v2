import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Paper,
} from "@mui/material";

const CustomerSource = () => {
  const [sources, setSources] = useState([]);
  const [newSource, setNewSource] = useState("");
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchSources = async () => {
      if (user) {
        const sourcesCollection = collection(
          db,
          `users/${user.uid}/customerSource`
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
  }, [user]);

  const handleAddSource = async () => {
    if (newSource) {
      await addDoc(collection(db, `users/${user.uid}/customerSource`), {
        name: newSource,
      });
      setSources([...sources, { id: Date.now().toString(), name: newSource }]);
      setNewSource("");
    }
  };

  const handleDeleteSource = async (id) => {
    await deleteDoc(doc(db, `users/${user.uid}/customerSource/${id}`));
    setSources(sources.filter((source) => source.id !== id));
  };

  const handleUpdateSource = async (id, newSourceValue) => {
    await updateDoc(doc(db, `users/${user.uid}/customerSource/${id}`), {
      name: newSourceValue,
    });
    setSources(
      sources.map((source) =>
        source.id === id ? { ...source, name: newSourceValue } : source
      )
    );
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Gérer les Provenances de Contact
        </Typography>
        {sources.map((source) => (
          <Box key={source.id} display="flex" alignItems="center" mb={2}>
            <TextField
              fullWidth
              variant="outlined"
              value={source.name}
              onChange={(e) => handleUpdateSource(source.id, e.target.value)}
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

        <Box display="flex" alignItems="center" mt={2}>
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
      </Paper>
    </Container>
  );
};

export default CustomerSource;
