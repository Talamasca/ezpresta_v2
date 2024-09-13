import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { TextField, MenuItem, Button, IconButton, Dialog } from "@mui/material";
import { PersonAdd as PersonAddIcon } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import Autocomplete from "@mui/material/Autocomplete";
import CustomerForm from "../components/CustomerForm";

function Reservation() {
  const { currentUser } = useAuth();
  const [catalogItems, setCatalogItems] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const [openCustomerForm, setOpenCustomerForm] = useState(false); // Pour gérer l'ouverture du formulaire

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
          enqueueSnackbar("Failed to load data: " + error.message, {
            variant: "error",
          });
        }
      }
    };

    fetchCatalogAndClients();
  }, [currentUser, enqueueSnackbar]);

  const handleServiceChange = (event) => {
    setSelectedService(event.target.value);
  };

  const handleClientChange = (event, newValue) => {
    setSelectedClient(newValue);
  };

  const toggleDialog = () => {
    setOpenDialog(!openDialog);
  };

  const handleCustomerSave = (newCustomer) => {
    setClients((prevClients) => [...prevClients, newCustomer]); // Ajouter le nouveau client à la liste existante
    setSelectedClient(newCustomer); // Sélectionner automatiquement le nouveau client
    setOpenCustomerForm(false); // Fermer le formulaire après la sauvegarde
    setOpenDialog(false); // Fermer le dialogue
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
      <Autocomplete
        options={clients}
        getOptionLabel={(option) => (option ? option.firstname : "")}
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
    </div>
  );
}

export default Reservation;
