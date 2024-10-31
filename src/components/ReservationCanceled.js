import React, { useState, useEffect } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, MenuItem } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import { IconButton } from "@mui/material";
import { db } from "../firebase";
import { doc, updateDoc, collection, getDocs } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { Tooltip } from "@mui/material";

const CancelReservation = ({ reservation }) => {
    const reservationId = reservation.id;
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState("");
  
  useEffect(() => {
    const fetchRejectionReasons = async () => {
      const reasonsCollection = collection(db, `users/${currentUser.uid}/rejectionReasons`);
      const reasonsSnapshot = await getDocs(reasonsCollection);
      const reasonsList = reasonsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setRejectionReasons(reasonsList);
    };

    fetchRejectionReasons();
  }, [currentUser.uid]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleCancelOrder = async () => {
    const orderRef = doc(db, `users/${currentUser.uid}/orders/${reservationId}`);
    const currentDate = new Date().toISOString();

    await updateDoc(orderRef, {
      orderIsCanceled: true,
      rejectionReason: selectedReason || null,
      rejectionDate: currentDate,
    });

    setOpen(false);
  };

  return (
    <>
     <Tooltip title={reservation.orderIsCanceled ? "Prestation déjà annulée" : "Annuler la prestation" }>
          <IconButton onClick={handleOpen}  disabled={reservation.orderIsConfirmed}>
                <CancelIcon color={reservation.orderIsCanceled ? "disabled" : "primary"} /> 
          </IconButton>
     </Tooltip>     
      
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Annuler la Prestation</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Motif de refus (optionnel)"
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            margin="normal"
          >
            <MenuItem value="">Aucun</MenuItem>
            {rejectionReasons.map((reason) => (
              <MenuItem key={reason.id} value={reason.name}>
                {reason.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Annuler
          </Button>
          <Button onClick={handleCancelOrder} color="error">
            Confirmer l'annulation
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CancelReservation;