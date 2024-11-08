import React, { useEffect,useState } from "react";

import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Divider,
  FormControl,
  IconButton,
  Menu,
  MenuItem,
  Select,
  Switch,
  Typography
} from "@mui/material";

import { useAuth } from "../contexts/AuthContext";
import { getAvailableYears } from "./utils";


const FilterMenu = ({
  filterUpcoming,
  setFilterUpcoming,
  filterConfirmed,
  setFilterConfirmed,
  filterPending,
  setFilterPending,
  filterYear,
  setFilterYear,
  filterUnpaid,  // Nouveau filtre "paiement en attente"
  setFilterUnpaid  // Setter pour le filtre "paiement en attente"
}) => {
  const { currentUser } = useAuth();
  const [availableYears, setAvailableYears] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const currentYear = new Date().getFullYear();
  //const [selectedYear, setSelectedYear] = useState(""); // valeur par défaut vide


  useEffect(() => {
    const fetchYears = async () => {
      if (currentUser) {
        const years = await getAvailableYears(currentUser.uid);
        setAvailableYears(years);
      }
    };
    fetchYears();
  }, [currentUser]);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <>
      <IconButton aria-label="Filter list" onClick={handleClick} style={{ position: "absolute", top: "85px", right: "20px" }}>
        <FilterListIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" style={{ fontWeight: "bold" }}>Filtres</Typography>
        </MenuItem>
        <Divider style={{ margin: "0 6px" }} />

        <MenuItem>
          Prestations à venir
          <Switch
            checked={filterUpcoming}
            onChange={() => setFilterUpcoming(prev => !prev)}
          />
        </MenuItem>
        <MenuItem>
          Prestations validées
          <Switch
            checked={filterConfirmed}
            onChange={() => setFilterConfirmed(prev => !prev)}
          />
        </MenuItem>
        <MenuItem>
          Prestations en attente
          <Switch
            checked={filterPending}
            onChange={() => setFilterPending(prev => !prev)}
          />
        </MenuItem>
        <MenuItem>
          Paiement en attente
          <Switch checked={filterUnpaid} onChange={() => setFilterUnpaid(prev => !prev)} /> {/* Nouveau filtre */}
        </MenuItem>
        <MenuItem>
          Année :
          <FormControl variant="standard">
            <Select value={filterYear || ""} onChange={e => setFilterYear(e.target.value)} displayEmpty>
              <MenuItem value="">Toutes</MenuItem>
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </MenuItem>
      </Menu>
    </>
  );
};

export default FilterMenu;
