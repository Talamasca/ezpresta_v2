import React, { useEffect, useState } from "react";
import { RotatingLines } from "react-loader-spinner";
import { endOfYear, startOfYear } from "date-fns";
import { useSnackbar } from "notistack";

import AccountBoxIcon from "@mui/icons-material/AccountBox";
//import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete"; // Import de l'icône de suppression
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import MapIcon from "@mui/icons-material/Map";
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from "@mui/material";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where } from "firebase/firestore";

import CustomerDetails from "../components/CustomerDetails";
import FilterMenu from "../components/FilterMenu";
import CancelReservation from "../components/ReservationCanceled";
import ReservationICS from "../components/ReservationICS"; // Import du composant BookingIcal
import PaymentManagement from "../components/ReservationPaymentManagement";
import PDFInvoiceGenerator from "../components/ReservationPDF";
import ReservationTodo from "../components/ReservationTodo";
import ReservationUpload from "../components/ReservationUpload";
import ValidateReservation from "../components/ReservationValidate";
import { useAuth } from "../contexts/AuthContext"; // Pour récupérer l'utilisateur connecté
import { db } from "../firebase"; // Firebase Firestore instance



const Agenda = () => {
  const { currentUser } = useAuth();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);  // État de chargement

  // États pour les réservations et filtres
  const [reservations, setReservations] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    upcoming: false,
    confirmed: false,
    pending: false,
    unpaid: false,
    year: new Date().getFullYear()
  });

  // Fonction pour récupérer les informations supplémentaires (catalogue et client)
  const fetchAdditionalData = async reservation => {
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
        clientName
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
      setLoading(true);  // Démarrer le chargement
      const ordersRef = collection(db, `users/${currentUser.uid}/orders`);
      let reservationsQuery;

      if (filterOptions.year) {
        const startOfSelectedYear = startOfYear(new Date(filterOptions.year, 0, 1)).toISOString();
        const endOfSelectedYear = endOfYear(new Date(filterOptions.year, 0, 1)).toISOString();
        reservationsQuery = query(
          ordersRef,
          where("selectedDate", ">=", startOfSelectedYear),
          where("selectedDate", "<", endOfSelectedYear),
          orderBy("selectedDate", "asc")
        );
      } else {
        reservationsQuery = query(ordersRef, orderBy("selectedDate", "asc"));
      }

      try {
        const querySnapshot = await getDocs(reservationsQuery);
        const reservationsData = [];

        for (const doc of querySnapshot.docs) {
          const reservation = { id: doc.id, ...doc.data() };
          const enhancedReservation = await fetchAdditionalData(reservation);
          reservationsData.push(enhancedReservation);
        }

        const filteredData = reservationsData.filter(reservation => {
          const isUpcoming = filterOptions.upcoming ? new Date(reservation.selectedDate) > new Date() : true;
          const isConfirmed = filterOptions.confirmed ? reservation.orderIsConfirmed : true;
          const isPending = filterOptions.pending
            ? !reservation.orderIsConfirmed && !reservation.orderIsCanceled
            : true;
          const isUnpaid = filterOptions.unpaid
            ? reservation.paymentDetails.some(payment => !payment.isPaid && reservation.orderIsConfirmed)
            : true;
          return isUpcoming && isConfirmed && isPending && isUnpaid;
        });

        setReservations(filteredData);
      } catch (error) {
        enqueueSnackbar("Erreur lors du chargement des réservations", { variant: "error" });
      } finally {
        setLoading(false);  // Arrêter le chargement
      }
    };

    fetchReservations();
  }, [currentUser, filterOptions]);

  // Fonction pour supprimer une réservation
  const handleDeleteReservation = async (reservationId, reservation) => {
    if (reservation.orderIsConfirmed) {
      enqueueSnackbar("Vous ne pouvez pas effacer une prestation validée", {
        variant: "error"
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
        variant: "success"
      });

      // Mettre à jour l'état local en supprimant la réservation effacée
      const updatedReservations = reservations.filter(
        r => r.id !== reservationId
      );
      setReservations(updatedReservations);
    } catch (error) {
      enqueueSnackbar("Erreur lors de la suppression", { variant: "error" });
    }
  };

  // Ajout de la boîte de dialogue de confirmation
  const [openDialog, setOpenDialog] = useState(false); // État pour gérer l'ouverture de la boîte de dialogue
  const [reservationToDelete, setReservationToDelete] = useState(null); // Garde la réservation à supprimer

  const handleOpenDialog = reservation => {
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
  const handleOpenCustomerDialog = async customerId => {
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

  const toggleMenu = id => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div>
      <h1>Agenda</h1>

      <FilterMenu setFilterOptions={setFilterOptions} currentYear={filterOptions.year} />

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
          <RotatingLines
            strokeColor="blue"
            strokeWidth="5"
            animationDuration="0.75"
            width="96"
            visible={true}
          />
        </Box>
      ) : (
        <TableContainer component={ Paper }>
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
              { reservations.map(reservation => (
                <React.Fragment key={ reservation.id }>
                  <TableRow>
                    <TableCell>
                      <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={ () => toggleMenu(reservation.id) }
                      >
                        { openMenuId === reservation.id ? (
                          <KeyboardArrowUpIcon />
                        ) : (
                          <KeyboardArrowDownIcon />
                        ) }
                      </IconButton>
                    </TableCell>
                    <TableCell>{ reservation.productType }</TableCell>
                    <TableCell>
                      { new Date(reservation.selectedDate).toLocaleString(
                        "fr-FR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "long"
                        }
                      ) }
                    </TableCell>
                    <TableCell>
                      { reservation.clientName }
                      <IconButton
                        onClick={ () =>
                          handleOpenCustomerDialog(reservation.client_id)
                        }
                      >
                        <AccountBoxIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>{ reservation.totalPrice } €</TableCell>
                    <TableCell>
                      { reservation.locations && reservation.locations.length > 0
                        ? reservation.locations[0].locationWhere.slice(0, 60) ||
                        "Lieu non défini"
                        : "Lieu non défini" }
                      { reservation.locations && reservation.locations[0]?.place_id && (
                        <IconButton component="a" href={ `https://www.google.com/maps/place/?q=place_id:${reservation.locations[0].place_id}` } target="_blank" rel="noopener noreferrer" >
                          <MapIcon />
                        </IconButton>
                      ) }
                    </TableCell>
                  </TableRow>

                  { /* Menu d'actions */ }
                  <TableRow>
                    <TableCell
                      style={ { paddingBottom: 0, paddingTop: 0 } }
                      colSpan={ 6 }
                    >
                      <Collapse
                        in={ openMenuId === reservation.id }
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box margin={ 1 }>
                          <div style={ { textAlign: "center" } }>
                          
                            <span>
                              <ValidateReservation reservation={ reservation } />
                            </span>
                          
                            <span aria-label="Annulation de la réservation">
                              <CancelReservation reservation={ reservation } />
                            </span>

                            <span aria-label="Calendrier">
                              { /* Export ICS*/ }
                              <ReservationICS reservation={ reservation } />
                            </span>
                            <span aria-label="Gestion des paiements">
                              <PaymentManagement reservation={ reservation } />
                            </span>
                            <span aria-label="Todo list">
                              { /* Export TODO */ }
                              <ReservationTodo reservation={ reservation } />
                            </span>
                            <span aria-label="Todo list">
                              { /* Export TODO */ }
                              <ReservationUpload reservation={ reservation } />
                            </span>
                            <span>
                              <PDFInvoiceGenerator reservation={ reservation } />
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
                                  onClick={ () =>
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
              )) }
            </TableBody>
          </Table>
        </TableContainer>
      ) }

      { /* Boîte de dialogue pour les détails du client */ }
      <CustomerDetails
        open={ dialogOpen }
        handleClose={ handleCloseCustomerDialog }
        customer={ selectedCustomer }
        customerId={ selectedCustomerId }
      />

      { /* Boîte de dialogue de confirmation de suppression */ }
      <Dialog
        open={ openDialog }
        onClose={ handleCloseDialog }
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          { "Confirmation de suppression" }
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Veuillez confirmer que vous souhaitez bien supprimer cette
            prestation. Attention cette action est irréversible ! (Note : vous
            ne pouvez pas effacer les prestations validées / payées)
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={ handleCloseDialog } color="primary">
            Annuler
          </Button>
          <Button onClick={ confirmDelete } color="secondary" >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Agenda;
