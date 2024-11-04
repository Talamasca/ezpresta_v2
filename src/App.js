// src/App.js
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes
} from "react-router-dom";
import { SnackbarProvider } from "notistack";

import Box from "@mui/material/Box";
import { blue, grey } from "@mui/material/colors";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme,ThemeProvider } from "@mui/material/styles";

//import Toolbar from "@mui/material/Toolbar";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import WorkflowForm from "./components/WorkflowForm";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Agenda from "./pages/Agenda";
import Catalogue from "./pages/Catalogue";
import Customers from "./pages/Customers";
import CustomerSource from "./pages/CustomerSource";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import RejectionReasons from "./pages/RejectionReasons";
import Reservation from "./pages/Reservation";
import Settings from "./pages/Settings";
import Workflow from "./pages/Workflow";

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        light: blue[300],
        main: blue[500],
        dark: blue[700],
        darker: blue[900]
      },
      action: {
        hover: darkMode ? blue[800] : grey[50]
      }
    },
    components: {
      MuiTableRow: {
        styleOverrides: {
          root: ({ theme }) => ({
            // Appliquer les styles uniquement aux lignes dans le `TableBody`
            ["tbody &"]: {
              "&:nth-of-type(odd)": {
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? theme.palette.grey[800] // Mode sombre, ligne impaire
                    : theme.palette.action.hover // Mode clair, ligne impaire
              },
              "&:hover": {
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? theme.palette.grey[700] // Mode sombre, survol
                    : blue[50] // Mode clair, survol
              }
            }
          }),
          head: ({ theme }) => ({
            // Styles pour les lignes dans le `TableHead`
            backgroundColor:
              theme.palette.mode === "dark"
                ? theme.palette.grey[900] // Mode sombre pour le `TableHead`
                : blue[200] // Mode clair pour le `TableHead`
          })
        }
      }
    }
  });

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={ theme }>
      <CssBaseline />
      <SnackbarProvider maxSnack={ 3 }>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={ <Login /> } />
              <Route
                path="*"
                element={
                  <PrivateLayout toggleTheme={ toggleTheme } darkMode={ darkMode }>
                    <Routes>
                      <Route path="/dashboard" element={ <Dashboard /> } />
                      <Route path="/customers" element={ <Customers /> } />
                      <Route path="/catalogue" element={ <Catalogue /> } />

                      <Route path="/reservation" element={ <Reservation /> } />
                      <Route path="/settings" element={ <Settings /> } />
                      <Route path="/workflow" element={ <Workflow /> } />
                      <Route
                        path="/edit-workflow/:workflowId"
                        element={ <WorkflowForm /> }
                      />
                      <Route
                        path="/customer-source"
                        element={ <CustomerSource /> }
                      />
                      <Route path="/rejection-reasons" element={ <RejectionReasons /> } />
                      <Route
                        path="*"
                        element={ <Navigate to="/dashboard" replace /> }
                      />
                      <Route path="/agenda" element={ <Agenda /> } />
                    </Routes>
                  </PrivateLayout>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

function PrivateLayout({ children, toggleTheme, darkMode }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box sx={ { display: "flex", height: "100vh" } }>
      <Header toggleTheme={ toggleTheme } darkMode={ darkMode } />
      <Sidebar />
      <Box
        component="main"
        sx={ {
          flexGrow: 1,
          p: 3,
          marginTop: "64px", // Adjust based on header height
          zIndex: 0
        } }
      >
        { children }
      </Box>
    </Box>
  );
}

export default App;
