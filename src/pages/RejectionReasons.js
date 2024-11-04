import React, { useEffect, useState } from "react";

import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography
} from "@mui/material";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc
} from "firebase/firestore";

import { db } from "../firebase";

const RejectionReasons = () => {
  const [reasons, setReasons] = useState([]);
  const [newReason, setNewReason] = useState("");
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchReasons = async () => {
      if (user) {
        const reasonsCollection = collection(db, `users/${user.uid}/rejectionReasons`);
        const reasonsSnapshot = await getDocs(reasonsCollection);
        const reasonsList = reasonsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setReasons(reasonsList);
      }
    };

    fetchReasons();
  }, [user]);

  const handleAddReason = async () => {
    if (newReason) {
      const newReasonRef = await addDoc(collection(db, `users/${user.uid}/rejectionReasons`), {
        name: newReason
      });
      setReasons([...reasons, { id: newReasonRef.id, name: newReason }]);
      setNewReason("");
    }
  };

  const handleDeleteReason = async id => {
    await deleteDoc(doc(db, `users/${user.uid}/rejectionReasons/${id}`));
    setReasons(reasons.filter(reason => reason.id !== id));
  };

  const handleUpdateReason = async (id, newReasonValue) => {
    await updateDoc(doc(db, `users/${user.uid}/rejectionReasons/${id}`), {
      name: newReasonValue
    });
    setReasons(
      reasons.map(reason =>
        reason.id === id ? { ...reason, name: newReasonValue } : reason
      )
    );
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={ 3 } sx={ { p: 4, mt: 4 } }>
        <Typography variant="h5" gutterBottom>
          Gérer les Motifs de Refus
        </Typography>
        { reasons.map(reason => (
          <Box key={ reason.id } display="flex" alignItems="center" mb={ 2 }>
            <TextField
              fullWidth
              variant="outlined"
              value={ reason.name }
              onChange={ e => handleUpdateReason(reason.id, e.target.value) }
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={ () => handleDeleteReason(reason.id) }
              sx={ { ml: 2 } }
            >
              Supprimer
            </Button>
          </Box>
        )) }

        <Box display="flex" alignItems="center" mt={ 2 }>
          <TextField
            fullWidth
            variant="outlined"
            label="Ajouter un motif de refus"
            value={ newReason }
            onChange={ e => setNewReason(e.target.value) }
          />
          <Button
            variant="contained"
            color="primary"
            onClick={ handleAddReason }
            sx={ { ml: 2 } }
          >
            Ajouter
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default RejectionReasons;
