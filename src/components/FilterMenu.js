import React, { useEffect, useState } from "react";

import FilterListIcon from "@mui/icons-material/FilterList";
import { Badge, Box, Button, FormControl, FormControlLabel, IconButton, Menu, MenuItem, Select, Switch, Typography } from "@mui/material";

import { getAvailableYears } from "../components/utils";
import { useAuth } from "../contexts/AuthContext";

const FilterMenu = ({ setFilterOptions, currentYear }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState([]);
  const { currentUser } = useAuth();

  const [filters, setFilters] = useState({
    upcoming: false,
    confirmed: false,
    pending: false,
    unpaid: false
  });

  useEffect(() => {
    const fetchYears = async () => {
      const years = await getAvailableYears(currentUser.uid);
      setAvailableYears(["Toutes les années", ...years]); // Ajouter "Toutes les années" au début de la liste
      if (years.includes(currentYear)) setSelectedYear(currentYear);
    };
    fetchYears();
  }, [currentUser, currentYear]);

  const handleOpenMenu = event => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleYearChange = event => {
    const selectedValue = event.target.value;
    setSelectedYear(selectedValue);
    setFilterOptions({ ...filters, year: selectedValue === "Toutes les années" ? null : selectedValue });
  };

  const handleFilterChange = name => event => {
    const updatedFilters = { ...filters, [name]: event.target.checked };
    setFilters(updatedFilters);
    setFilterOptions({ ...updatedFilters, year: selectedYear === "Toutes les années" ? null : selectedYear });
  };

  // Vérification si au moins un filtre est actif
  const isAnyFilterActive = Object.values(filters).some(value => value);

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      upcoming: false,
      confirmed: false,
      pending: false,
      unpaid: false
    });
    setSelectedYear("Toutes les années");
    setFilterOptions({
      upcoming: false,
      confirmed: false,
      pending: false,
      unpaid: false,
      year: null
    });
    handleCloseMenu();
    window.location.reload();
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}> {/* Alignement à droite */}
      <Badge
        color="error"
        variant="dot"
        invisible={!isAnyFilterActive}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
        overlap="circular"  // Position de chevauchement pour rapprocher la pastille
      >
        <IconButton onClick={handleOpenMenu}>
          <FilterListIcon />
        </IconButton>
      </Badge>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}  // Menu à droite
        transformOrigin={{ vertical: "top", horizontal: "right" }}  // Origine de l'animation à droite
        sx={{ maxWidth: "300px" }} // Limite de largeur pour le menu
      >
        <Box sx={{ padding: 2, width: "250px" }}>
          <Typography variant="h6" gutterBottom>Filtres</Typography>
          <FormControl fullWidth margin="dense">
            <Select value={selectedYear} onChange={handleYearChange} displayEmpty>
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
            <FormControlLabel
              control={<Switch checked={filters.upcoming} onChange={handleFilterChange("upcoming")} />}
              label="Prestations à venir"
            />
            <FormControlLabel
              control={<Switch checked={filters.confirmed} onChange={handleFilterChange("confirmed")} />}
              label="Prestations validées"
            />
            <FormControlLabel
              control={<Switch checked={filters.pending} onChange={handleFilterChange("pending")} />}
              label="Prestations en attente"
            />
            <FormControlLabel
              control={<Switch checked={filters.unpaid} onChange={handleFilterChange("unpaid")} />}
              label="Paiements en attente"
            />
          </Box>
          <Button onClick={handleCloseMenu} fullWidth variant="contained" sx={{ mt: 2 }}>
            Appliquer
          </Button>
          <Button onClick={resetFilters} fullWidth variant="outlined" sx={{ mt: 1 }}>
            Réinitialiser
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default FilterMenu;
