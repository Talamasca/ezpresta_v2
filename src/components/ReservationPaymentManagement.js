import React, { useState } from "react";
import { useSnackbar } from "notistack";

import EuroIcon from "@mui/icons-material/Euro";
import PaymentIcon from "@mui/icons-material/Payment";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { doc, updateDoc } from "firebase/firestore";

import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";

const paymentMethods = [
  { id: "CB", name: "Carte bancaire" },
  { id: "CHK", name: "Chèque" },
  { id: "PP", name: "PayPal" },
  { id: "SEPA", name: "Virement" },
  { id: "ESP", name: "Espèce" }
];

const PaymentManagement = ({ reservation }) => {
  const { currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);

  // État local pour les détails de paiement et les modifications
  const [localPaymentDetails, setLocalPaymentDetails] = useState([...reservation.paymentDetails]);
  const [paymentUpdates, setPaymentUpdates] = useState(
    reservation.paymentDetails.map(() => ({
      paymentMethod: "",
      paymentDate: new Date().toISOString().split("T")[0]
    }))
  );

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handlePaymentUpdate = async index => {
    // Mettre à jour les détails de paiement locaux
    const updatedPaymentDetails = [...localPaymentDetails];
    const paymentUpdate = paymentUpdates[index];

    // Modifier les données de paiement validées
    updatedPaymentDetails[index] = {
      ...updatedPaymentDetails[index],
      isPaid: true,
      paymentMode: paymentUpdate.paymentMethod,
      paymentDate: paymentUpdate.paymentDate
    };

    // Vérification de si tous les paiements sont complétés
    const allPaid = updatedPaymentDetails.every(detail => detail.isPaid);
    const fullyPaidDate = allPaid ? new Date().toISOString() : null;

    try {
      // Mettre à jour dans Firestore
      await updateDoc(doc(db, `users/${currentUser.uid}/orders/${reservation.id}`), {
        paymentDetails: updatedPaymentDetails,
        fullyPaid: allPaid,
        fullyPaidDate: fullyPaidDate
      });

      // Mettre à jour immédiatement l'état local pour un rendu dynamique
      setLocalPaymentDetails(updatedPaymentDetails);

      // Réinitialiser l’état de modification
      setPaymentUpdates(prev =>
        prev.map((update, i) => (i === index ? { paymentMethod: "", paymentDate: "" } : update))
      );

      enqueueSnackbar("Paiement validé avec succès.", { variant: "success" });

      if (allPaid) {
        enqueueSnackbar("La commande a été entièrement payée.", { variant: "success" });
      }
    } catch (error) {
      enqueueSnackbar("Erreur lors de la validation du paiement.", { variant: "error" });
    }
  };

  const handleChange = (index, field, value) => {
    const updatedPaymentUpdates = [...paymentUpdates];
    updatedPaymentUpdates[index][field] = value;
    setPaymentUpdates(updatedPaymentUpdates);
  };

  return (
    <>
      <Tooltip title="Gérer les paiements">
        <IconButton onClick={ handleOpen }>
          <PaymentIcon color="primary" />
        </IconButton>
      </Tooltip>

      <Dialog open={ open } onClose={ handleClose } fullWidth>
        <DialogTitle>Gestion des Paiements</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Plan de paiement : { reservation.paymentPlan }
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>N°</TableCell>
                  <TableCell>Montant</TableCell>
                  <TableCell>Mode de paiement</TableCell>
                  <TableCell>Date de paiement</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { localPaymentDetails.map((payment, index) => (
                  <TableRow key={ index }>
                    <TableCell>#{ index + 1 }</TableCell>
                    <TableCell>{ parseFloat(payment.value).toFixed(2) } €</TableCell>
                    { payment.isPaid ? (
                      <>
                        <TableCell>{ payment.paymentMode }</TableCell>
                        <TableCell>{ payment.paymentDate }</TableCell>
                        <TableCell>
                          <EuroIcon color="success" /> { /* Icône euro en vert */ }
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <TextField
                            select
                            fullWidth
                            label="Mode de paiement"
                            value={ paymentUpdates[index].paymentMethod }
                            onChange={ 
                              e => handleChange(index, "paymentMethod", e.target.value) 
                            }
                          >
                            { paymentMethods.map(method => (
                              <MenuItem key={ method.id } value={ method.name }>
                                { method.name }
                              </MenuItem>
                            )) }
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            type="date"
                            label="Date de paiement"
                            value={ paymentUpdates[index].paymentDate }
                            onChange={ 
                              e => handleChange(index, "paymentDate", e.target.value) 
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={ () => handlePaymentUpdate(index) }
                          >
                            Valider
                          </Button>
                        </TableCell>
                      </>
                    ) }
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={ handleClose } color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PaymentManagement;
