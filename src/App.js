// src/App.js
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SnackbarProvider } from "notistack";
import Customers from "./pages/Customers";
import Catalogue from "./pages/Catalogue";
import Settings from "./pages/Settings";
import Reservation from "./pages/Reservation";
import Workflow from "./pages/Workflow";
import WorkflowForm from "./components/WorkflowForm";
import CustomerSource from "./pages/CustomerSource";

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
    },
  });

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="*"
                element={
                  <PrivateLayout toggleTheme={toggleTheme} darkMode={darkMode}>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/catalogue" element={<Catalogue />} />
                      <Route path="/reservation" element={<Reservation />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/workflow" element={<Workflow />} />
                      <Route
                        path="/edit-workflow/:workflowId"
                        element={<WorkflowForm />}
                      />
                      <Route
                        path="/customer-source"
                        element={<CustomerSource />}
                      />
                      <Route
                        path="*"
                        element={<Navigate to="/dashboard" replace />}
                      />
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
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Header toggleTheme={toggleTheme} darkMode={darkMode} />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginTop: "64px", // Adjust based on header height
          zIndex: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default App;
