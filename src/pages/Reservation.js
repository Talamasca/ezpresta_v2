// Reservation.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { useSnackbar } from "notistack";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import frLocale from "date-fns/locale/fr";
import {
  Checkbox,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Button,
  Dialog,
  Autocomplete as MUIAutocomplete,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import CancelIcon from "@mui/icons-material/Cancel";
import EditLocationIcon from "@mui/icons-material/EditLocation";
import { PersonAdd as PersonAddIcon } from "@mui/icons-material";
import AddFeeDialog from "../components/AddFeeDialog";
import CustomerForm from "../components/CustomerForm";
import LocationForm from "../components/LocationForm";
import AddDiscountDialog from "../components/AddDiscountDialog";

function Reservation() {
  const { currentUser } = useAuth();
  const [catalogItems, setCatalogItems] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [selectedDate, setSelectedDate] = useState(null);
  const [fees, setFees] = useState([]); // Stocker les frais supplémentaires
  const [totalPrice, setTotalPrice] = useState(0); // Prix total (prestation + frais)
  const [servicePrice, setServicePrice] = useState(0); // Stocker le prix de la prestation
  const [discounts, setDiscounts] = useState([]); // Stocker les remises

  const [openCustomerForm, setOpenCustomerForm] = useState(false);
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [locations, setLocations] = useState([]);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [locationToRemove, setLocationToRemove] = useState(null);

  const handleOpenConfirmDialog = (index) => {
    setLocationToRemove(index);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setLocationToRemove(null);
  };

  const handleConfirmRemoveLocation = () => {
    removeLocationByIndex(locationToRemove);
    handleCloseConfirmDialog();
  };

  useEffect(() => {
    const fetchCatalogAndClients = async () => {
      if (currentUser) {
        const catalogRef = collection(db, `users/${currentUser.uid}/catalog`);
        const customersRef = collection(
          db,
          `users/${currentUser.uid}/customers`
        );
        try {
          const [catalogSnapshot, customerSnapshot] = await Promise.all([
            getDocs(query(catalogRef)),
            getDocs(query(customersRef)),
          ]);
          setCatalogItems(
            catalogSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          setClients(
            customerSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        } catch (error) {
          enqueueSnackbar(
            "Échec du chargement des données : " + error.message,
            {
              variant: "error",
            }
          );
        }
      }
    };

    fetchCatalogAndClients();
  }, [currentUser, enqueueSnackbar]);

  // Calculer le prix total dès qu'il y a un changement dans les frais ou la prestation sélectionnée
  useEffect(() => {
    const totalFees = fees.reduce((acc, fee) => acc + fee.feeAmount, 0);

    const totalDiscounts = discounts.reduce((acc, discount) => {
      if (discount.isPercentage) {
        return acc + (servicePrice * discount.discountAmount) / 100;
      } else {
        return acc + discount.discountAmount;
      }
    }, 0);

    setTotalPrice(
      parseFloat(servicePrice) +
        parseFloat(totalFees) -
        parseFloat(totalDiscounts)
    );
  }, [servicePrice, fees, discounts]);

  const handleServiceChange = (event) => {
    const selectedServiceId = event.target.value;
    setSelectedService(selectedServiceId);

    // Trouver le prix de la prestation sélectionnée
    const selectedService = catalogItems.find(
      (item) => item.id === selectedServiceId
    );
    setServicePrice(selectedService ? selectedService.price : 0);
  };

  const handleClientChange = (event, newValue) => {
    setSelectedClient(newValue);
  };

  const toggleDialog = () => {
    setOpenDialog(!openDialog);
  };

  const handleCustomerSave = (newCustomer) => {
    setClients((prevClients) => [...prevClients, newCustomer]);
    setSelectedClient(newCustomer);
    setOpenCustomerForm(false);
    setOpenDialog(false);
  };

  const handleOpenLocationModal = () => {
    setOpenLocationModal(true);
  };

  const handleCloseLocationModal = () => {
    setOpenLocationModal(false);
  };

  const handleLocationSave = (newLocation) => {
    setLocations((prevLocations) => [...prevLocations, newLocation]);
    enqueueSnackbar("Lieu ajouté avec succès", { variant: "success" });
  };

  const removeLocationByIndex = (indexToRemove) => {
    setLocations((prevLocations) =>
      prevLocations.filter((_, index) => index !== indexToRemove)
    );
  };

  const setLocationAsDefault = (indexToSet) => {
    setLocations((prevLocations) =>
      prevLocations.map((location, index) => ({
        ...location,
        isDefault: index === indexToSet,
      }))
    );
  };

  const handleAddDiscount = (newDiscount) => {
    setDiscounts((prevDiscounts) => [...prevDiscounts, newDiscount]);
  };
  const handleAddFee = (newFee) => {
    setFees((prevFees) => [...prevFees, newFee]);
  };

  const removeByIndex = (indexToRemove, type) => {
    if (type === "fee") {
      setFees((prevFees) =>
        prevFees.filter((_, index) => index !== indexToRemove)
      );
    } else if (type === "discount") {
      setDiscounts((prevDiscounts) =>
        prevDiscounts.filter((_, index) => index !== indexToRemove)
      );
    }
  };

  return (
    <div>
      <TextField
        select
        label="Type de prestation"
        value={selectedService}
        onChange={handleServiceChange}
        fullWidth
      >
        {catalogItems.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {item.type} : {item.name} - {item.price}€
          </MenuItem>
        ))}
      </TextField>
      <MUIAutocomplete
        options={clients}
        getOptionLabel={(option) =>
          option ? `${option.firstname} ${option.lastname}` : ""
        }
        style={{ width: 300 }}
        onChange={handleClientChange}
        renderInput={(params) => (
          <TextField {...params} label="Client" variant="outlined" />
        )}
        value={selectedClient}
        id="client"
        name="client"
      />

      <Button
        variant="outlined"
        color="primary"
        startIcon={<PersonAddIcon />}
        onClick={toggleDialog}
        size="small"
      >
        Nouveau client
      </Button>

      <Dialog open={openDialog} onClose={toggleDialog} maxWidth="md" fullWidth>
        <CustomerForm
          open={openDialog}
          handleClose={toggleDialog}
          onSave={handleCustomerSave}
        />
      </Dialog>

      <LocalizationProvider dateAdapter={AdapterDateFns} locale={frLocale}>
        <DatePicker
          label="Date de la prestation"
          value={selectedDate}
          onChange={(newValue) => {
            setSelectedDate(newValue);
          }}
          renderInput={(params) => (
            <TextField {...params} fullWidth margin="normal" />
          )}
        />
      </LocalizationProvider>

      <Button
        variant="outlined"
        color="primary"
        onClick={handleOpenLocationModal}
        size="small"
        startIcon={<EditLocationIcon />}
      >
        Ajouter un lieu
      </Button>

      <Dialog
        open={openLocationModal}
        onClose={handleCloseLocationModal}
        maxWidth="sm"
        fullWidth
      >
        <LocationForm
          selectedDate={selectedDate}
          onClose={handleCloseLocationModal}
          onSave={handleLocationSave}
        />
      </Dialog>

      {/* Affichage des lieux ajoutés */}
      {locations.map((location, index) => (
        <div key={index}>
          <p>Date : {location.eventDate.toLocaleString()}</p>
          <p>Événement : {location.eventName}</p>
          <p>
            Lieu :{" "}
            {location.place
              ? location.place.description || location.place.formatted_address
              : ""}
          </p>
        </div>
      ))}

      {locations.length >= 1 ? (
        <TableContainer component={Paper}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="left">Lieu Principal</TableCell>
                <TableCell align="center">Date</TableCell>
                <TableCell align="center">Lieu</TableCell>
                <TableCell align="center">Note</TableCell>
                {/* <TableCell  align="center">
                                                        Distance
                                                    </TableCell> */}
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((v, index) => {
                return (
                  <TableRow key={v.place_id + index.toString()}>
                    <TableCell align="left">
                      <Checkbox
                        checked={v.isDefault}
                        onChange={() => setLocationAsDefault(index)}
                        inputProps={{ "aria-label": "primary checkbox" }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {new Date(v.eventDate).toLocaleString("fr-FR", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </TableCell>
                    <TableCell align="center">
                      {v.place
                        ? v.place.description || v.place.formatted_address
                        : ""}
                    </TableCell>
                    <TableCell align="center">{v.eventName}</TableCell>
                    {/* <TableCell  align="center">
                                                                {v.distance || "Loading..."}
                                                            </TableCell> */}
                    <TableCell align="center">
                      <IconButton
                        type="button"
                        variant="contained"
                        color="secondary"
                        size="medium"
                        //disabled={isSubmitting}
                        onClick={() => {
                          //_removeLocationById(index);
                          //removeLocationByIndex(index);
                          handleOpenConfirmDialog(index);
                        }}
                      >
                        <CancelIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}

      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer ce lieu ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Annuler
          </Button>
          <Button onClick={handleConfirmRemoveLocation} color="secondary">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <fieldset>
        <legend>Options</legend>
        {/* Bouton pour ajouter des frais supplémentaires */}
        <AddFeeDialog onAddFee={handleAddFee} />

        {/* Liste des frais supplémentaires */}
        <TableContainer component={Paper}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="center">Titre</TableCell>
                <TableCell align="center">Montant</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fees.map((fee, index) => (
                <TableRow key={index}>
                  <TableCell>{fee.feeName}</TableCell>
                  <TableCell align="right">{fee.feeAmount} €</TableCell>
                  <TableCell align="center">
                    <IconButton
                      type="button"
                      color="secondary"
                      size="small"
                      onClick={() => removeByIndex(index, "fee")}
                    >
                      <CancelIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Bouton pour ajouter une remise */}
        <AddDiscountDialog onAddDiscount={handleAddDiscount} />

        {/* Liste des remises */}
        {discounts.length > 0 && (
          <TableContainer component={Paper}>
            <Table aria-label="remises">
              <TableHead>
                <TableRow>
                  <TableCell>Nom de la réduction</TableCell>
                  <TableCell align="right">Montant</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {discounts.map((discount, index) => (
                  <TableRow key={index}>
                    <TableCell>{discount.discountName}</TableCell>
                    <TableCell align="right">
                      {discount.discountAmount}{" "}
                      {discount.isPercentage ? "%" : "€"}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        type="button"
                        color="secondary"
                        size="small"
                        onClick={() => removeByIndex(index, "discount")}
                      >
                        <CancelIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Affichage du prix total */}
        <h3>Prix de la prestation : {servicePrice} €</h3>
        <h3>
          Frais supplémentaires :{" "}
          {fees.reduce((acc, fee) => acc + fee.feeAmount, 0)} €
        </h3>
        <h3>
          Montant total des remises :
          {discounts.reduce((acc, discount) => {
            if (discount.isPercentage) {
              return acc + (servicePrice * discount.discountAmount) / 100;
            } else {
              return acc + discount.discountAmount;
            }
          }, 0)}{" "}
          €
        </h3>
        <h2>Prix total : {totalPrice} €</h2>
      </fieldset>
    </div>
  );
}

export default Reservation;
