import React, { useState } from "react";
import { Link } from "react-router-dom";

import { ExpandLess, ExpandMore } from "@mui/icons-material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CancelPresentationIcon from "@mui/icons-material/CancelPresentation";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventIcon from "@mui/icons-material/Event";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import StoreIcon from "@mui/icons-material/Store";
import WorkIcon from "@mui/icons-material/Work";
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar
} from "@mui/material";
import Avatar from "@mui/material/Avatar";

import { useAuth } from "../contexts/AuthContext";

const Sidebar = () => {
  const { currentUser } = useAuth();
  const [openSettings, setOpenSettings] = useState(false); // Pour gérer le sous-menu

  const handleSettingsClick = () => {
    setOpenSettings(!openSettings); // Ouvre ou ferme le sous-menu Réglages
  };

  const menuItems = [
    { text: "Tableau de bord", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Catalogue", icon: <StoreIcon />, path: "/Catalogue" },
    { text: "Clients", icon: <PeopleIcon />, path: "/Customers" },
    { text: "Agenda", icon: <EventIcon />, path: "/Agenda" },
    { text: "Nouveau Rdv", icon: <AddCircleIcon />, path: "/new-appointment" },
    {
      text: "Nouvelle réservation",
      icon: <AddShoppingCartIcon />,
      path: "/Reservation"
    }
  ];

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={ {
        width: 240,
        flexShrink: 0,
        ["& .MuiDrawer-paper"]: {
          width: 240,
          boxSizing: "border-box",
          top: "64px" // Ajuste selon la hauteur de l'en-tête
        }
      } }
    >
      <Toolbar />
      <Box
        sx={ {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px"
        } }
      >
        { currentUser && currentUser.logo ? (
          <Avatar
            src={ currentUser.logo }
            alt={ currentUser.username || currentUser.email }
            sx={ { width: 100, height: 100 } }
          />
        ) : (
          <Avatar sx={ { width: 100, height: 100 } } />
        ) }
      </Box>
      <Divider />
      <List>
        { menuItems.map(item => (
          <ListItem button component={ Link } to={ item.path } key={ item.text }>
            <ListItemIcon>{ item.icon }</ListItemIcon>
            <ListItemText primary={ item.text } />
          </ListItem>
        )) }

        { /* Menu Réglages avec sous-menu */ }
        <ListItem button onClick={ handleSettingsClick }>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Réglages" />
          { openSettings ? <ExpandLess /> : <ExpandMore /> }
        </ListItem>

        <Collapse in={ openSettings } timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem button component={ Link } to="/settings" sx={ { pl: 4 } }>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Parametres" />
            </ListItem>

            <ListItem
              button
              component={ Link }
              to="/customer-source"
              sx={ { pl: 4 } }
            >
              <ListItemIcon>
                <ContactPhoneIcon />
              </ListItemIcon>
              <ListItemText primary="Gérer les provenances de contact" />
            </ListItem>
            
            <ListItem
              button
              component={ Link }
              to="/rejection-reasons"
              sx={ { pl: 4 } }
            >
              <ListItemIcon>
                <CancelPresentationIcon />
              </ListItemIcon>
              <ListItemText primary="Gérer les motifs de refus" />
            </ListItem>
            
            <ListItem button component={ Link } to="/workflow" sx={ { pl: 4 } }>
              <ListItemIcon>
                <WorkIcon />
              </ListItemIcon>
              <ListItemText primary="Workflow" />
            </ListItem>
          </List>
        </Collapse>
      </List>
    </Drawer>
  );
};

export default Sidebar;
