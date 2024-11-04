// src/components/CustomerDetails.js
import React, { useEffect, useState } from "react";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import HomeIcon from "@mui/icons-material/Home";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import NoteIcon from "@mui/icons-material/Note";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import SourceIcon from "@mui/icons-material/Source";
import { List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography
} from "@mui/material";
import Link from "@mui/material/Link";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

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

const CustomerDetails = ({ open, handleClose, customer, customerId }) => {
  const [customerData, setCustomerData] = useState(customer);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (customerId) {
        setLoading(true);
        const customerDoc = doc(
          db,
          `users/${auth.currentUser.uid}/customers`,
          customerId
        );
        const docSnap = await getDoc(customerDoc);
        if (docSnap.exists()) {
          setCustomerData(docSnap.data());
        } else {
          console.log("No such document!");
        }
        setLoading(false);
      }
    };

    if (customerId && !customer) {
      fetchCustomer();
    } else {
      setCustomerData(customer);
    }
  }, [customerId, customer]);

  return (
    <Dialog open={ open } onClose={ handleClose }>
      { loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="200px"
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <DialogTitle>Coordonnées</DialogTitle>
          <Divider />
          <DialogContent>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Avatar
                sx={ { bgcolor: "primary.main", width: 56, height: 56, mb: 2 } }
              >
                { customerData?.firstname?.charAt(0) }
              </Avatar>
              <Typography variant="h6">{ customerData?.firstname }</Typography>
            </Box>
            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary={ customerData?.firstname } />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <MailOutlineIcon />
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Link href={ `mailto:${customerData?.email}` }>
                      { customerData?.email }
                    </Link>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Link href={ `${phoneGetURI(customerData?.phone)}` }>
                      { formatPhoneNumber(customerData?.phone) }
                    </Link>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary={ customerData?.userAddress } />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <NoteIcon />
                </ListItemIcon>
                <ListItemText primary={ customerData?.userNote } />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SourceIcon />
                </ListItemIcon>
                <ListItemText primary={ customerData?.source } />
              </ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={ handleClose } color="primary">
              Quitter
            </Button>
          </DialogActions>
        </>
      ) }
    </Dialog>
  );
};

export default CustomerDetails;
