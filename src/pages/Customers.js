// src/pages/Customers.js
import React, { useEffect, useState } from "react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useSnackbar } from "notistack";

import { Add as AddIcon, Delete, Edit } from "@mui/icons-material";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import {
  Box,
  CircularProgress,
  Fab,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";

import CustomerDetails from "../components/CustomerDetails";
import CustomerForm from "../components/CustomerForm";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";

//import "./Customers.css";

const formatPhoneNumber = phoneNumber => {
  if (!phoneNumber) return "";
  const phoneNumberParsed = parsePhoneNumberFromString(phoneNumber, "FR");
  if (phoneNumberParsed) {
    return phoneNumberParsed.formatInternational();
  }
  return phoneNumber;
};

const phoneGetURI = phoneNumber => {
  if (!phoneNumber) return "";
  const phoneNumberParsed = parsePhoneNumberFromString(phoneNumber, "FR");
  if (phoneNumberParsed) {
    return phoneNumberParsed.getURI();
  }
  return phoneNumber;
};

const Customers = () => {
  const { currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (currentUser) {
        try {
          const customersRef = collection(
            db,
            `users/${currentUser.uid}/customers`
          );
          const snapshot = await getDocs(customersRef);
          const customersList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          setCustomers(customersList);
          setLoading(false);
        } catch (error) {
          enqueueSnackbar("Error fetching customers: " + error.message, {
            variant: "error"
          });
          setLoading(false);
        }
      }
    };

    fetchCustomers();
  }, [currentUser, enqueueSnackbar]);

  const handleOpenDialog = (customer, customerId = null) => {
    setSelectedCustomer(customer);
    setSelectedCustomerId(customerId);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCustomer(null);
    setSelectedCustomerId(null);
  };

  const handleOpenForm = (customer = null, customerId = null) => {
    setSelectedCustomer(customer);
    setSelectedCustomerId(customerId);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedCustomer(null);
    setSelectedCustomerId(null);
  };

  const handleSaveCustomer = newCustomer => {
    setCustomers(prevCustomers =>
      prevCustomers.some(customer => customer.id === newCustomer.id)
        ? prevCustomers.map(customer =>
          customer.id === newCustomer.id ? newCustomer : customer
        )
        : [...prevCustomers, newCustomer]
    );
    handleCloseForm();
  };

  const handleDeleteCustomer = async customerId => {
    try {
      await deleteDoc(
        doc(db, `users/${currentUser.uid}/customers`, customerId)
      );
      setCustomers(customers.filter(customer => customer.id !== customerId));
      enqueueSnackbar("Ce compte client a bien été effacé", {
        variant: "success"
      });
    } catch (error) {
      enqueueSnackbar("Error deleting customer: " + error.message, {
        variant: "error"
      });
    }
  };

  if (loading) {
    return (
      <Box
        sx={ {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh"
        } }
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Typography
        variant="h4"
        sx={ {
          margin: theme => theme.spacing(4, 0, 2),
          textAlign: "center",
          fontWeight: "bold"
        } }
      >
        Liste des clients
      </Typography>
      <TableContainer
        component={ Paper }
        sx={ {
          marginTop: theme => theme.spacing(4)
        } }
      >
        <Table sx={ { minWidth: 650 } }>
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>First Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            { customers.map(customer => (
              <TableRow key={ customer.id }>
                <TableCell sx={ { padding: theme => theme.spacing(2) } }>
                  { customer.company }
                </TableCell>
                <TableCell sx={ { padding: theme => theme.spacing(2) } }>
                  { customer.email }
                </TableCell>
                <TableCell sx={ { padding: theme => theme.spacing(2) } }>
                  { customer.firstname }
                </TableCell>
                <TableCell sx={ { padding: theme => theme.spacing(2) } }>
                  <a href={ phoneGetURI(customer?.phone) }>
                    { formatPhoneNumber(customer?.phone) }
                  </a>
                </TableCell>
                <TableCell sx={ { padding: theme => theme.spacing(2) } }>
                  { customer.userAddress }
                </TableCell>
                <TableCell sx={ { padding: theme => theme.spacing(2) } }>
                  { customer.userNote }
                </TableCell>
                <TableCell sx={ { padding: theme => theme.spacing(2) } }>
                  <IconButton
                    onClick={ () => handleOpenDialog(customer, customer.id) }
                  >
                    <AccountBoxIcon />
                  </IconButton>
                  <IconButton
                    onClick={ () => handleOpenForm(customer, customer.id) }
                  >
                    <Edit />
                  </IconButton>
                  <IconButton onClick={ () => handleDeleteCustomer(customer.id) }>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            )) }
          </TableBody>
        </Table>
      </TableContainer>

      <CustomerDetails
        open={ dialogOpen }
        handleClose={ handleCloseDialog }
        customer={ selectedCustomer }
        customerId={ selectedCustomerId }
      />

      <CustomerForm
        open={ formOpen }
        handleClose={ handleCloseForm }
        customer={ selectedCustomer }
        customerId={ selectedCustomerId }
        userId={ currentUser.uid }
        onSave={ handleSaveCustomer }
      />

      <Fab
        variant="extended"
        color="primary"
        aria-label="add"
        sx={ {
          position: "fixed",
          bottom: theme => theme.spacing(2),
          right: theme => theme.spacing(2),
          width: 58,
          overflow: "hidden",
          whiteSpace: "nowrap",
          fontSize: 0,
          transition: "width 0.5s, border-radius 0.5s, background-color 0.5s",
          //paddingLeft: 25,
          "&:hover": {
            fontSize: 15,
            width: 300,
            borderRadius: 15
          }
        } }
        onClick={ () => handleOpenForm(null, null) }
      >
        <AddIcon
          sx={ { marginRight: theme => theme.spacing(1), fontSize: 32 } }
        />
        Ajouter un contact
      </Fab>
    </>
  );
};

export default Customers;
