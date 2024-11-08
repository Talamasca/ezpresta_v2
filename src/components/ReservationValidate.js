import React, { useState } from "react";
import { useSnackbar } from "notistack";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Tooltip } from "@mui/material";
import { doc, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions"; // Import correct des fonctions Firebase

import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase"; // Firebase Firestore instance

const ValidateReservation = ({ reservation }) => {
  const { currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleValidate = async () => {
    const orderRef = doc(db, `users/${currentUser.uid}/orders/${reservation.id}`);

    try {
      await updateDoc(orderRef, {
        orderIsConfirmed: true,
        orderIsCanceled: false, // Retirer l'annulation si elle était présente
        orderIsConfirmedDate: new Date().toISOString(),
        rejectionDate: null, // Retirer la date d'annulation si elle était présente
        rejectionReason: null // Retirer la raison d'annulation si elle était présente
      });

      // Envoi d'un e-mail de confirmation via Firebase Functions
      const functions = getFunctions();
      const sendMessage = httpsCallable(functions, "sendConfirmationOrderV2");

      await sendMessage({
        email: reservation.email,
        username: reservation.clientName,
        catalogType: reservation.productType,
        client: reservation.clientName,
        where: reservation.locations[0]?.locationWhere || "Lieu non défini",
        placeId: reservation.locations[0]?.place_id || "N/A",
        priceToPay: reservation.totalPrice,
        date: new Date(reservation.selectedDate).toLocaleString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long"
        })
      });

      enqueueSnackbar("Prestation validée et e-mail envoyé.", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Erreur lors de la validation de la prestation.", { variant: "error" });
    }
  };

  const handleOpenConfirmation = () => {
    if (reservation.orderIsCanceled) {
      setConfirmDialogOpen(true);
    } else {
      handleValidate();
    }
  };

  const handleCloseConfirmation = () => setConfirmDialogOpen(false);

  const confirmValidation = () => {
    handleValidate();
    handleCloseConfirmation();
  };

  return (
    <>
      <Tooltip title={ reservation.orderIsConfirmed ? "Prestation déjà validée" : "Valider la prestation" }>
        <span>
          <IconButton onClick={ handleOpenConfirmation } disabled={ reservation.orderIsConfirmed }>
            <CheckCircleIcon color={ reservation.orderIsConfirmed ? "disabled" : "primary" } />
          </IconButton>
        </span>
      </Tooltip>

      <Dialog open={ confirmDialogOpen } onClose={ handleCloseConfirmation }>
        <DialogTitle>Confirmation de validation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Cette prestation est actuellement annulée. Voulez-vous vraiment la valider et annuler l&apos;annulation ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={ handleCloseConfirmation } color="primary">Annuler</Button>
          <Button onClick={ confirmValidation } color="primary" >Confirmer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ValidateReservation;
