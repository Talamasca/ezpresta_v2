// src/components/Sidebar.js
import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Toolbar,
  Divider,
} from "@mui/material";
import { Link } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import StoreIcon from "@mui/icons-material/Store";
import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "@mui/material/Avatar";
import "../App.css";

const Sidebar = () => {
  const { currentUser } = useAuth();

  const menuItems = [
    { text: "Tableau de bord", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Catalogue", icon: <StoreIcon />, path: "/Catalogue" },
    { text: "Clients", icon: <PeopleIcon />, path: "/Customers" },
    { text: "Agenda", icon: <EventIcon />, path: "/agenda" },
    { text: "Nouveau Rdv", icon: <AddCircleIcon />, path: "/new-appointment" },
    { text: "Nouvelle commande", icon: <AddCircleIcon />, path: "/new-order" },
    { text: "Réglages", icon: <SettingsIcon />, path: "/settings" },
  ];

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 240,
          boxSizing: "border-box",
          top: "64px", // Adjust based on header height
        },
      }}
    >
      <Toolbar />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px",
        }}
      >
        {currentUser && currentUser.logo ? (
          <Avatar
            src={currentUser.logo}
            alt={currentUser.username || currentUser.email}
            sx={{ width: 100, height: 100 }}
          />
        ) : (
          <Avatar sx={{ width: 100, height: 100 }} />
        )}
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem button component={Link} to={item.path} key={item.text}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
