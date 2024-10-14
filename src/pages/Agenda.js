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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CustomerDetails from "../components/CustomerDetails";
import { useSnackbar } from "notistack";

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
        reservation.orderData.catalog_id
      );
      const catalogSnap = await getDoc(catalogRef);
      const productType = catalogSnap.exists()
        ? catalogSnap.data().type
        : "Type inconnu";

      const clientRef = doc(
        db,
        `users/${currentUser.uid}/customers`,
        reservation.orderData.client_id
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
          orderBy("orderData.selectedDate", "asc")
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
        email: reservation.orderData.email,
        username: reservation.clientName,
        catalogType: reservation.productType,
        client: reservation.clientName,
        where:
          reservation.orderData.locations[0]?.locationWhere ||
          "Lieu non défini",
        placeId: reservation.orderData.locations[0]?.place_id || "N/A",
        priceToPay: reservation.orderData.totalPrice,
        date: new Date(reservation.orderData.selectedDate).toLocaleString(
          "fr-FR",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          }
        ),
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

  // Fonction pour gérer l'ouverture de la boîte de dialogue de détails du client
  const handleOpenDialog = async (customerId) => {
    const clientRef = doc(db, `users/${currentUser.uid}/customers`, customerId);
    const clientSnap = await getDoc(clientRef);
    if (clientSnap.exists()) {
      setSelectedCustomer(clientSnap.data());
      setSelectedCustomerId(customerId);
      setDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
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
                    {new Date(
                      reservation.orderData.selectedDate
                    ).toLocaleString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
                  </TableCell>
                  <TableCell>
                    {reservation.clientName}
                    <IconButton
                      onClick={() =>
                        handleOpenDialog(reservation.orderData.client_id)
                      }
                    >
                      <AccountBoxIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>{reservation.orderData.totalPrice} €</TableCell>
                  <TableCell>
                    {reservation.orderData.locations &&
                    reservation.orderData.locations.length > 0
                      ? reservation.orderData.locations[0].locationWhere.slice(
                          0,
                          60
                        ) || "Lieu non défini"
                      : "Lieu non défini"}
                    {reservation.orderData.locations &&
                      reservation.orderData.locations[0]?.place_id && (
                        <IconButton
                          component="a"
                          href={`https://www.google.com/maps/place/?q=place_id:${reservation.orderData.locations[0].place_id}`}
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
                          <Tooltip
                            title={
                              reservation.orderIsConfirmed
                                ? "Prestation déjà validée"
                                : "Valider la prestation"
                            }
                          >
                            <span>
                              <IconButton
                                onClick={() =>
                                  handleValidateReservation(
                                    reservation.id,
                                    reservation
                                  )
                                }
                                disabled={reservation.orderIsConfirmed}
                              >
                                <CheckCircleIcon
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
        handleClose={handleCloseDialog}
        customer={selectedCustomer}
        customerId={selectedCustomerId}
      />
    </div>
  );
};

export default Agenda;
