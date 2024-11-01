import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase"; // Firebase Firestore instance
import { getFunctions, httpsCallable } from "firebase/functions"; // Import correct des fonctions Firebase
import { useAuth } from "../contexts/AuthContext"; // Pour récupérer l'utilisateur connecté
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Box,
  Tooltip,
} from "@mui/material";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import MapIcon from "@mui/icons-material/Map";
//import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CustomerDetails from "../components/CustomerDetails";
import { useSnackbar } from "notistack";
import { deleteDoc } from "firebase/firestore";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete"; // Import de l'icône de suppression
import ReservationICS from "../components/ReservationICS"; // Import du composant BookingIcal
import ReservationTodo from "../components/ReservationTodo";
import ReservationUpload from "../components/ReservationUpload";
import PDFInvoiceGenerator from "../components/ReservationPDF";
import CancelReservation from "../components/ReservationCanceled";
import ValidateReservation from "../components/ReservationValidate";
import PaymentManagement from "../components/ReservationPaymentManagement";

const Agenda = () => {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  // Fonction pour récupérer les informations supplémentaires (catalogue et client)
  const fetchAdditionalData = async (reservation) => {
    try {
      const catalogRef = doc(
        db,
        `users/${currentUser.uid}/catalog`,
        reservation.catalog_id
      );
      const catalogSnap = await getDoc(catalogRef);
      const productType = catalogSnap.exists()
        ? catalogSnap.data().type
        : "Type inconnu";

      const clientRef = doc(
        db,
        `users/${currentUser.uid}/customers`,
        reservation.client_id
      );
      const clientSnap = await getDoc(clientRef);
      const clientName = clientSnap.exists()
        ? `${clientSnap.data().firstname}`
        : "Client inconnu";

      return {
        ...reservation,
        productType,
        clientName,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des informations supplémentaires :",
        error
      );
      return reservation;
    }
  };

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const q = query(
          collection(db, `users/${currentUser.uid}/orders`),
          orderBy("selectedDate", "asc")
        );
        const querySnapshot = await getDocs(q);
        const reservationsData = [];

        for (const doc of querySnapshot.docs) {
          const reservation = {
            id: doc.id,
            ...doc.data(),
          };
          const enhancedReservation = await fetchAdditionalData(reservation);
          reservationsData.push(enhancedReservation);
        }

        setReservations(reservationsData);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des réservations :",
          error
        );
      }
    };

    fetchReservations();
  }, [currentUser]);

  // Fonction pour valider la prestation et envoyer un email
  const handleValidateReservation = async (reservationId, reservation) => {
    if (reservation.orderIsConfirmed) {
      enqueueSnackbar("Cette prestation est déjà validée.", {
        variant: "info",
      });
      return;
    }

    try {
      const orderRef = doc(
        db,
        `users/${currentUser.uid}/orders`,
        reservationId
      );
      await updateDoc(orderRef, {
        orderIsConfirmed: true,
        orderIsConfirmedDate: new Date().toISOString(),
      });

      // Envoi d'un e-mail via Firebase Functions
      const functions = getFunctions(); // Initialiser les fonctions Firebase
      const sendMessage = httpsCallable(functions, "sendConfirmationOrderV2"); // Fonction pour envoyer l'e-mail

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
          weekday: "long",
        }),
      });

      enqueueSnackbar("Prestation validée et e-mail envoyé.", {
        variant: "success",
      });

      // Mise à jour de l'état local
      const updatedReservations = reservations.map((r) =>
        r.id === reservationId ? { ...r, orderIsConfirmed: true } : r
      );
      setReservations(updatedReservations);
    } catch (error) {
      enqueueSnackbar("Erreur lors de la validation de la prestation.", {
        variant: "error",
      });
    }
  };

  // Calcul des événements pour le calendrier
  const calculateEvent = (reservation) => ({
    title: `EzPresta : ${reservation.productType} - ${reservation.clientName}`,
    description: `Prestation avec ${reservation.clientName}`,
    startTime: reservation.selectedDate,
    endTime: new Date(
      new Date(reservation.selectedDate).getTime() + 8 * 60 * 60 * 1000
    ), // Durée de 8 heures
    location: reservation.locations[0]?.locationWhere || "Lieu non défini",
  });

  // Fonction pour supprimer une réservation
  const handleDeleteReservation = async (reservationId, reservation) => {
    if (reservation.orderIsConfirmed) {
      enqueueSnackbar("Vous ne pouvez pas effacer une prestation validée", {
        variant: "error",
      });
      return;
    }

    try {
      const orderRef = doc(
        db,
        `users/${currentUser.uid}/orders`,
        reservationId
      );
      await deleteDoc(orderRef); // Supprime la réservation dans Firestore

      enqueueSnackbar("La prestation a bien été effacée", {
        variant: "success",
      });

      // Mettre à jour l'état local en supprimant la réservation effacée
      const updatedReservations = reservations.filter(
        (r) => r.id !== reservationId
      );
      setReservations(updatedReservations);
    } catch (error) {
      enqueueSnackbar("Erreur lors de la suppression", { variant: "error" });
    }
  };

  // Ajout de la boîte de dialogue de confirmation
  const [openDialog, setOpenDialog] = useState(false); // État pour gérer l'ouverture de la boîte de dialogue
  const [reservationToDelete, setReservationToDelete] = useState(null); // Garde la réservation à supprimer

  const handleOpenDialog = (reservation) => {
    setReservationToDelete(reservation);
    setOpenDialog(true); // Ouvre la boîte de dialogue
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setReservationToDelete(null); // Ferme la boîte de dialogue et réinitialise la réservation
  };

  const confirmDelete = () => {
    if (reservationToDelete) {
      handleDeleteReservation(reservationToDelete.id, reservationToDelete);
      handleCloseDialog(); // Ferme la boîte de dialogue après suppression
    }
  };

  // Fonction pour gérer l'ouverture de la boîte de dialogue de détails du client
  const handleOpenCustomerDialog = async (customerId) => {
    const clientRef = doc(db, `users/${currentUser.uid}/customers`, customerId);
    const clientSnap = await getDoc(clientRef);
    if (clientSnap.exists()) {
      setSelectedCustomer(clientSnap.data());
      setSelectedCustomerId(customerId);
      setDialogOpen(true);
    }
  };

  const handleCloseCustomerDialog = () => {
    setDialogOpen(false);
    setSelectedCustomer(null);
    setSelectedCustomerId(null);
  };

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div>
      <h1>Agenda des Réservations</h1>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Type de prestation</TableCell>
              <TableCell>Date de la prestation</TableCell>
              <TableCell>Nom du client</TableCell>
              <TableCell>Prix total</TableCell>
              <TableCell>Lieu principal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reservations.map((reservation) => (
              <React.Fragment key={reservation.id}>
                <TableRow>
                  <TableCell>
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      onClick={() => toggleMenu(reservation.id)}
                    >
                      {openMenuId === reservation.id ? (
                        <KeyboardArrowUpIcon />
                      ) : (
                        <KeyboardArrowDownIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell>{reservation.productType}</TableCell>
                  <TableCell>
                    {new Date(reservation.selectedDate).toLocaleString(
                      "fr-FR",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "long",
                      }
                    )}
                  </TableCell>
                  <TableCell>
                    {reservation.clientName}
                    <IconButton
                      onClick={() =>
                        handleOpenCustomerDialog(reservation.client_id)
                      }
                    >
                      <AccountBoxIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>{reservation.totalPrice} €</TableCell>
                  <TableCell>
                    {reservation.locations && reservation.locations.length > 0
                      ? reservation.locations[0].locationWhere.slice(0, 60) ||
                        "Lieu non défini"
                      : "Lieu non défini"}
                    {reservation.locations &&
                      reservation.locations[0]?.place_id && (
                        <IconButton
                          component="a"
                          href={`https://www.google.com/maps/place/?q=place_id:${reservation.locations[0].place_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MapIcon />
                        </IconButton>
                      )}
                  </TableCell>
                </TableRow>

                {/* Menu d'actions */}
                <TableRow>
                  <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={6}
                  >
                    <Collapse
                      in={openMenuId === reservation.id}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box margin={1}>
                        <div style={{ textAlign: "center" }}>
                          
                          <span>
                            <ValidateReservation reservation={reservation} />
                          </span>
                          
                          <span aria-label="Annulation de la réservation">
                            <CancelReservation reservation={reservation} />
                          </span>

                          <span aria-label="Calendrier">
                            {/* Export ICS*/}
                            <ReservationICS reservation={reservation} />
                          </span>
                          <span aria-label="Gestion des paiements">
                            <PaymentManagement reservation={reservation} />
                          </span>
                          <span aria-label="Todo list">
                            {/* Export TODO */}
                            <ReservationTodo reservation={reservation} />
                          </span>
                          <span aria-label="Todo list">
                            {/* Export TODO */}
                            <ReservationUpload reservation={reservation} />
                          </span>
                          <span>
                            <PDFInvoiceGenerator reservation={reservation} />
                          </span>
                          <Tooltip
                            title={
                              reservation.orderIsConfirmed
                                ? "Vous ne pouvez pas effacer une prestation validée"
                                : "Supprimer la prestation"
                            }
                          >
                            <span>
                              <IconButton
                                onClick={() =>
                                  reservation.orderIsConfirmed
                                    ? enqueueSnackbar(
                                        "Vous ne pouvez pas effacer une prestation validée",
                                        { variant: "error" }
                                      )
                                    : handleOpenDialog(reservation)
                                }
                              >
                                <DeleteIcon
                                  color={
                                    reservation.orderIsConfirmed
                                      ? "disabled"
                                      : "primary"
                                  }
                                />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </div>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Boîte de dialogue pour les détails du client */}
      <CustomerDetails
        open={dialogOpen}
        handleClose={handleCloseCustomerDialog}
        customer={selectedCustomer}
        customerId={selectedCustomerId}
      />

      {/* Boîte de dialogue de confirmation de suppression */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirmation de suppression"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Veuillez confirmer que vous souhaitez bien supprimer cette
            prestation. Attention cette action est irréversible ! (Note : vous
            ne pouvez pas effacer les prestations validées / payées)
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Annuler
          </Button>
          <Button onClick={confirmDelete} color="secondary" autoFocus>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Agenda;
