// Reservation.jsx
import { useEffect, useState } from "react";
import frLocale from "date-fns/locale/fr";
import { useSnackbar } from "notistack";

import { PersonAdd as PersonAddIcon } from "@mui/icons-material";
import CancelIcon from "@mui/icons-material/Cancel";
import EditLocationIcon from "@mui/icons-material/EditLocation";
import {
  Autocomplete as MUIAutocomplete,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from "@mui/material";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import Paper from "@mui/material/Paper";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { addDoc, collection, getDocs, query } from "firebase/firestore";

import AddDiscountDialog from "../components/AddDiscountDialog";
import AddFeeDialog from "../components/AddFeeDialog";
import CustomerForm from "../components/CustomerForm";
import LocationForm from "../components/LocationForm";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";


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

  // Dans le state, on ajoute un état pour les workflows
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowTasks, setWorkflowTasks] = useState([]); // Les tâches du workflow sélectionné

  const handleOpenConfirmDialog = index => {
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

  // Fonction pour sauvegarder la réservation dans Firestore
  const handleSaveReservation = async () => {
    if (!selectedService || !selectedClient || !selectedDate) {
      enqueueSnackbar("Merci de remplir tous les champs requis.", {
        variant: "error"
      });
      return;
    }

    const orderData = {
      client_id: selectedClient.id, // Lien vers la collection "clients"
      catalog_id: selectedService, // Lien vers la collection "catalogues"
      servicePrice: servicePrice,
      fees: fees,
      discounts: discounts,
      totalPrice: totalPrice, // Prix total calculé
      selectedDate: selectedDate.toISOString(), // Date de la prestation
      locations: locations.map(location => ({
        place_id: location.place.place_id,
        locationWhere: location.place
          ? location.place.description || location.place.formatted_address
          : "",
        eventName: location.eventName,
        isDefault: location.isDefault || false,
        eventDate: location.eventDate
      })),
      workflow: selectedWorkflow
        ? {
          id: selectedWorkflow.id,
          tasks: workflowTasks // Liste des tâches
        }
        : null, // Workflow sélectionné s'il y en a un
      paymentPlan: paymentPlan !== "Non" ? paymentPlan : null, // Plan de paiement
      paymentDetails:
        paymentPlan !== "Non"
          ? paymentPercentages.map((percentage, index) => ({
            paymentNumber: index + 1,
            percentage: percentage,
            value: paymentValues[index],
            isPaid: false // Non payé par défaut
          }))
          : [], // Répartition des paiements si applicable
      createDate: new Date().toISOString() // Date de création
    };

    try {
      await addDoc(collection(db, `users/${currentUser.uid}/orders`), orderData); // Ajout de la réservation dans Firestore
      enqueueSnackbar("Réservation enregistrée avec succès.", {
        variant: "success"
      });
    } catch (error) {
      enqueueSnackbar(
        "Erreur lors de l'enregistrement de la réservation : " + error.message,
        { variant: "error" }
      );
    }
  };

  useEffect(() => {
    const fetchCatalogAndClients = async () => {
      if (currentUser) {
        const catalogRef = collection(db, `users/${currentUser.uid}/catalog`);
        const workflowsRef = collection(
          db,
          `users/${currentUser.uid}/workflows`
        );
        const customersRef = collection(
          db,
          `users/${currentUser.uid}/customers`
        );
        try {
          const [catalogSnapshot, customerSnapshot, workflowSnapshot] =
            await Promise.all([
              getDocs(query(catalogRef)),
              getDocs(query(customersRef)),
              getDocs(workflowsRef)
            ]);
          setCatalogItems(
            catalogSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          );
          setClients(
            customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          );
          setWorkflows(
            workflowSnapshot.docs.map(doc => ({
              id: doc.id,
              name: doc.data().name,
              tasks: doc.data().tasks || [] // S'assurer que les tâches sont récupérées
            }))
          );
        } catch (error) {
          enqueueSnackbar(
            "Échec du chargement des données : " + error.message,
            {
              variant: "error"
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

  const handleServiceChange = event => {
    const selectedServiceId = event.target.value;
    setSelectedService(selectedServiceId);

    // Trouver le prix de la prestation sélectionnée
    const selectedService = catalogItems.find(
      item => item.id === selectedServiceId
    );
    setServicePrice(selectedService ? selectedService.price : 0);
  };

  const handleClientChange = (event, newValue) => {
    setSelectedClient(newValue);
  };

  const toggleDialog = () => {
    setOpenDialog(!openDialog);
  };

  const handleCustomerSave = newCustomer => {
    setClients(prevClients => [...prevClients, newCustomer]);
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

  const handleLocationSave = newLocation => {
    setLocations(prevLocations => [...prevLocations, newLocation]);
    enqueueSnackbar("Lieu ajouté avec succès", { variant: "success" });
  };

  const removeLocationByIndex = indexToRemove => {
    setLocations(prevLocations =>
      prevLocations.filter((_, index) => index !== indexToRemove)
    );
  };

  const setLocationAsDefault = indexToSet => {
    setLocations(prevLocations =>
      prevLocations.map((location, index) => ({
        ...location,
        isDefault: index === indexToSet
      }))
    );
  };

  const handleAddDiscount = newDiscount => {
    setDiscounts(prevDiscounts => [...prevDiscounts, newDiscount]);
  };
  const handleAddFee = newFee => {
    setFees(prevFees => [...prevFees, newFee]);
  };

  const removeByIndex = (indexToRemove, type) => {
    if (type === "fee") {
      setFees(prevFees =>
        prevFees.filter((_, index) => index !== indexToRemove)
      );
    } else if (type === "discount") {
      setDiscounts(prevDiscounts =>
        prevDiscounts.filter((_, index) => index !== indexToRemove)
      );
    }
  };

  const [paymentPlan, setPaymentPlan] = useState("Non"); // Plan de paiement: Non, 2x, 3x
  const [paymentPercentages, setPaymentPercentages] = useState([100]);
  const [paymentValues, setPaymentValues] = useState([totalPrice]); // Montants en euros basés sur les pourcentages
  const [paymentError, setPaymentError] = useState(null);

  // Fonction pour recalculer les valeurs en euros
  const calculatePaymentValues = (total, percentages) => {
    return percentages.map(percentage => (total * percentage) / 100);
  };

  // Mise à jour des pourcentages et calcul des montants en euros lorsque le plan de paiement change
  const handlePaymentPlanChange = e => {
    const selectedPlan = e.target.value;
    setPaymentPlan(selectedPlan);

    let updatedPercentages;
    if (selectedPlan === "2x") {
      updatedPercentages = [50, 50];
    } else if (selectedPlan === "3x") {
      updatedPercentages = [30, 50, 20];
    } else {
      updatedPercentages = [100]; // Paiement unique ou "Non"
    }

    // Mettre à jour les pourcentages
    setPaymentPercentages(updatedPercentages);
    // Calculer les valeurs basées sur ces pourcentages
    setPaymentValues(calculatePaymentValues(totalPrice, updatedPercentages));
  };

  // Fonction pour recalculer et valider les pourcentages
  const handleRecalculate = () => {
    const totalPercentage = paymentPercentages.reduce(
      (acc, curr) => acc + curr,
      0
    );
    if (totalPercentage !== 100) {
      setPaymentError("Le total des pourcentages doit être égal à 100%.");
    } else {
      setPaymentError(null);
      setPaymentValues(calculatePaymentValues(totalPrice, paymentPercentages));
    }
  };

  return (
    <div>
      <Box sx={ { p: 2 } }>
        <Grid container spacing={ 5 }>
          <Grid item xs={ 12 } sm={ 12 } md={ 6 }>
            <Card>
              <CardContent sx={ { p: 2 } }>
                <Typography
                  variant="h6"
                  sx={ { fontWeight: 500, fontSize: "1.2rem", mb: 2 } }
                >
                  Nouvelle Prestation
                </Typography>

                <TextField
                  select
                  label="Type de prestation"
                  value={ selectedService }
                  onChange={ handleServiceChange }
                  fullWidth
                >
                  { catalogItems.map(item => (
                    <MenuItem key={ item.id } value={ item.id }>
                      { item.type } : { item.name } - { item.price }€
                    </MenuItem>
                  )) }
                </TextField>

                <div style={ { marginBottom: "1rem", marginTop: "1rem" } }>
                  <MUIAutocomplete
                    options={ clients }
                    getOptionLabel={ option =>
                      option ? `${option.firstname}` : ""
                    }
                    style={ { width: 300 } }
                    onChange={ handleClientChange }
                    renderInput={ params => (
                      <TextField
                        { ...params }
                        label="Client"
                        variant="outlined"
                      />
                    ) }
                    value={ selectedClient }
                    id="client"
                    name="client"
                  />
                </div>
                <div style={ { marginBottom: "1.3rem", marginTop: "1.2rem" } }>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={ <PersonAddIcon /> }
                    onClick={ toggleDialog }
                    size="small"
                  >
                    Nouveau client
                  </Button>{ " " }
                </div>

                <Dialog
                  open={ openDialog }
                  onClose={ toggleDialog }
                  maxWidth="md"
                  fullWidth
                >
                  <CustomerForm
                    open={ openDialog }
                    handleClose={ toggleDialog }
                    onSave={ handleCustomerSave }
                  />
                </Dialog>

                <LocalizationProvider
                  dateAdapter={ AdapterDateFns }
                  adapterLocale={ frLocale }
                >
                  <DatePicker
                    label="Date de la prestation"
                    value={ selectedDate }
                    onChange={ newValue => {
                      setSelectedDate(newValue);
                    } }
                    renderInput={ params => (
                      <TextField { ...params } fullWidth margin="normal" />
                    ) }
                  />
                </LocalizationProvider>
                <div style={ { marginBottom: "1.3rem", marginTop: "1.2rem" } }>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={ handleOpenLocationModal }
                    size="small"
                    startIcon={ <EditLocationIcon /> }
                  >
                    Ajouter un lieu
                  </Button>
                </div>

                <Dialog
                  open={ openLocationModal }
                  onClose={ handleCloseLocationModal }
                  maxWidth="sm"
                  fullWidth
                >
                  <LocationForm
                    selectedDate={ selectedDate }
                    onClose={ handleCloseLocationModal }
                    onSave={ handleLocationSave }
                  />
                </Dialog>

                { locations.length >= 1 ? (
                  <TableContainer component={ Paper }>
                    <Table aria-label="simple table">
                      <TableHead>
                        <TableRow>
                          <TableCell align="left" sx={ { fontWeight: 500 } }>
                            Lieu Principal
                          </TableCell>
                          <TableCell align="center">Date</TableCell>
                          <TableCell align="center">Lieu</TableCell>
                          <TableCell align="center">Note</TableCell>
                          { /* <TableCell  align="center">
                                                        Distance
                                                    </TableCell> */ }
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        { locations.map((v, index) => {
                          return (
                            <TableRow key={ v.place_id + index.toString() }>
                              <TableCell align="left">
                                <Checkbox
                                  checked={ v.isDefault }
                                  onChange={ () => setLocationAsDefault(index) }
                                  inputProps={ {
                                    "aria-label": "primary checkbox"
                                  } }
                                />
                              </TableCell>
                              <TableCell align="center">
                                { new Date(v.eventDate).toLocaleString("fr-FR", {
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "numeric"
                                }) }
                              </TableCell>
                              <TableCell align="center">
                                { v.place
                                  ? v.place.description ||
                                    v.place.formatted_address
                                  : "" }
                              </TableCell>
                              <TableCell align="center">
                                { v.eventName }
                              </TableCell>
                              { /* <TableCell  align="center">
                                                                {v.distance || "Loading..."}
                                                            </TableCell> */ }
                              <TableCell align="center">
                                <IconButton
                                  type="button"
                                  variant="contained"
                                  color="secondary"
                                  size="medium"
                                  //disabled={isSubmitting}
                                  onClick={ () => {
                                    //_removeLocationById(index);
                                    //removeLocationByIndex(index);
                                    handleOpenConfirmDialog(index);
                                  } }
                                >
                                  <CancelIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        }) }
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : null }

                <Dialog
                  open={ openConfirmDialog }
                  onClose={ handleCloseConfirmDialog }
                >
                  <DialogTitle>Confirmer la suppression</DialogTitle>
                  <DialogContent>
                    <DialogContentText>
                      Êtes-vous sûr de vouloir supprimer ce lieu ?
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={ handleCloseConfirmDialog } color="primary">
                      Annuler
                    </Button>
                    <Button
                      onClick={ handleConfirmRemoveLocation }
                      color="secondary"
                    >
                      Supprimer
                    </Button>
                  </DialogActions>
                </Dialog>
              </CardContent>
            </Card>
            <Card sx={ { marginBottom: "1.3rem", marginTop: "1.2rem" } }>
              <CardContent sx={ { p: 2 } }>
                <div style={ { marginBottom: "1rem", marginTop: "1rem" } }>
                  <TextField
                    select
                    label="Sélectionner un workflow"
                    value={ selectedWorkflow ? selectedWorkflow.id : "" }
                    onChange={ e => {
                      const selectedId = e.target.value;
                      const workflow = workflows.find(
                        w => w.id === selectedId
                      );
                      setSelectedWorkflow(workflow);
                      setWorkflowTasks(workflow ? workflow.tasks : []); // Charger les tâches du workflow sélectionné
                    } }
                    fullWidth
                  >
                    { workflows.map(workflow => (
                      <MenuItem key={ workflow.id } value={ workflow.id }>
                        { workflow.name } - { workflow.tasks.length } tâche(s)
                      </MenuItem>
                    )) }
                  </TextField>

                  { workflowTasks.length > 0 && (
                    <div style={ { marginTop: "20px" } }>
                      <Typography
                        variant="h6"
                        sx={ { fontWeight: 500, fontSize: "1rem", mb: 2 } }
                      >
                        { " " }
                        Liste des tâches pour ce workflow
                      </Typography>
                      <TableContainer component={ Paper }>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Tâche</TableCell>
                              <TableCell align="center">Terminé</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            { workflowTasks.map((task, index) => (
                              <TableRow key={ index }>
                                <TableCell>{ task.label }</TableCell>
                                <TableCell align="center">
                                  <Checkbox
                                    checked={ task.done || false }
                                    onChange={ e => {
                                      const updatedTasks = [...workflowTasks];
                                      updatedTasks[index].done =
                                        e.target.checked;
                                      setWorkflowTasks(updatedTasks); // Mettre à jour l'état local
                                    } }
                                  />
                                </TableCell>
                              </TableRow>
                            )) }
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </div>
                  ) }
                </div>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={ 12 } sm={ 12 } md={ 6 }>
            <Card>
              <CardContent sx={ { p: 2 } }>
                <Typography
                  variant="h6"
                  sx={ { fontWeight: 500, fontSize: "1.2rem", mb: 2 } }
                >
                  Frais supplémentaires et Remises
                </Typography>
                { /* Bouton pour ajouter des frais supplémentaires */ }
                <div style={ { marginBottom: "1.3rem", marginTop: "1.2rem" } }>
                  <AddFeeDialog onAddFee={ handleAddFee } />
                </div>
                { /* Liste des frais supplémentaires */ }
                { fees.length > 0 && (
                  <TableContainer component={ Paper }>
                    <Table
                      aria-label="simple table"
                      sx={ { borderRadius: "4px" } }
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell sx={ { fontWeight: 500 } }>Titre</TableCell>
                          <TableCell sx={ { fontWeight: 500 } } align="center">
                            Montant
                          </TableCell>
                          <TableCell sx={ { fontWeight: 500 } } align="center">
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        { fees.map((fee, index) => (
                          <TableRow key={ index }>
                            <TableCell>{ fee.feeName }</TableCell>
                            <TableCell align="right">
                              { fee.feeAmount } €
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                type="button"
                                color="secondary"
                                size="small"
                                onClick={ () => removeByIndex(index, "fee") }
                              >
                                <CancelIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )) }
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) }
                { /* Bouton pour ajouter une remise */ }
                <div style={ { marginBottom: "1.3rem", marginTop: "1.2rem" } }>
                  <AddDiscountDialog onAddDiscount={ handleAddDiscount } />
                </div>
                { /* Liste des remises */ }
                { discounts.length > 0 && (
                  <TableContainer component={ Paper }>
                    <Table aria-label="remises">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={ { fontWeight: 500 } }>
                            Nom de la réduction
                          </TableCell>
                          <TableCell sx={ { fontWeight: 500 } } align="right">
                            Montant
                          </TableCell>
                          <TableCell sx={ { fontWeight: 500 } } align="center">
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        { discounts.map((discount, index) => (
                          <TableRow key={ index }>
                            <TableCell>{ discount.discountName }</TableCell>
                            <TableCell align="right">
                              { discount.discountAmount }{ " " }
                              { discount.isPercentage ? "%" : "€" }
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                type="button"
                                color="secondary"
                                size="small"
                                onClick={ () => removeByIndex(index, "discount") }
                              >
                                <CancelIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )) }
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) }
              </CardContent>
            </Card>
            <Card sx={ { marginBottom: "1.3rem", marginTop: "1.2rem" } }>
              <CardContent sx={ { p: 2 } }>
                <Typography
                  variant="h6"
                  sx={ { fontWeight: 500, fontSize: "1.2rem", mb: 2 } }
                >
                  Prix final
                </Typography>
                { /* Affichage du prix total */ }
                <TableContainer component={ Paper }>
                  <Table aria-label="remises">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={ { fontWeight: 500 } }>
                          Désignation
                        </TableCell>
                        <TableCell sx={ { fontWeight: 500 } } align="right">
                          Montant
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Prix de la prestation</TableCell>
                        <TableCell align="right">{ servicePrice } €</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Frais supplémentaires</TableCell>
                        <TableCell align="right">
                          { fees.reduce((acc, fee) => acc + fee.feeAmount, 0) } €
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Montant total des remises</TableCell>
                        <TableCell align="right">
                          { discounts.reduce((acc, discount) => {
                            if (discount.isPercentage) {
                              return (
                                acc +
                                (servicePrice * discount.discountAmount) / 100
                              );
                            } else {
                              return acc + discount.discountAmount;
                            }
                          }, 0) }{ " " }
                          €
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body1" sx={ { fontWeight: 600 } }>
                            Prix total
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" sx={ { fontWeight: 600 } }>
                            { totalPrice } €
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <div style={ { marginBottom: "1.3rem", marginTop: "1.2rem" } }>
                  <div style={ { marginBottom: "1.3rem", marginTop: "1.2rem" } }>
                    <Grid container alignItems="center" spacing={ 2 }>
                      <Grid item>
                        <Typography
                          variant="body1"
                          sx={ { fontWeight: 500, fontSize: "1rem" } }
                        >
                          Paiement en plusieurs fois
                        </Typography>
                      </Grid>
                      <Grid item>
                        <TextField
                          select
                          name="paymentPlan"
                          value={ paymentPlan }
                          onChange={ handlePaymentPlanChange } // Met à jour la répartition et les montants en euros
                          sx={ { width: "120px" } }
                        >
                          <MenuItem value="Non">Non</MenuItem>
                          <MenuItem value="2x">2x</MenuItem>
                          <MenuItem value="3x">3x</MenuItem>
                        </TextField>
                      </Grid>
                    </Grid>
                  </div>

                  { /* Affichage des lignes de paiement si paiement multiple */ }
                  { paymentPlan !== "Non" && (
                    <TableContainer
                      component={ Paper }
                      style={ { marginTop: "20px" } }
                    >
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Paiement n°</TableCell>
                            <TableCell>Répartition en %</TableCell>
                            <TableCell>Montant en €</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          { paymentPercentages.map((percentage, index) => (
                            <TableRow key={ index }>
                              <TableCell>{ `n°${index + 1}` }</TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  value={ percentage }
                                  onChange={ e => {
                                    const newPercentages = [
                                      ...paymentPercentages
                                    ];
                                    newPercentages[index] = parseInt(
                                      e.target.value
                                    );
                                    setPaymentPercentages(newPercentages);
                                  } }
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell>{ paymentValues[index] } €</TableCell>
                            </TableRow>
                          )) }
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) }

                  { /* Bouton pour recalculer la répartition */ }
                  { paymentPlan !== "Non" && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={ handleRecalculate }
                      style={ { marginTop: "20px", fontSize: "x-small" } }
                    >
                      Recalculer la répartition
                    </Button>
                  ) }

                  { /* Afficher une erreur si les pourcentages ne sont pas corrects */ }
                  { paymentError && (
                    <Typography color="error" style={ { marginTop: "10px" } }>
                      { paymentError }
                    </Typography>
                  ) }
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={ 12 } sm={ 12 } md={ 6 }>
            <div>
              { /* Autres composants existants */ }
              <Button
                variant="contained"
                color="primary"
                onClick={ handleSaveReservation }
                sx={ { marginTop: "20px" } }
              >
                Enregistrer la réservation
              </Button>
            </div>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}

export default Reservation;
