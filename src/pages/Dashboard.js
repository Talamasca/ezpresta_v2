import React, { useEffect,useState } from "react";

import { Grid, MenuItem, Paper, Select, Typography } from "@mui/material";

import AnnualStatistics from "../components/Charts/AnnualStatistics";
import BillingStatisticsChart from "../components/Charts/BillingStatisticsChart";
import ClientSourceChart from "../components/Charts/ClientSourceChart";
import GlobalStatistics from "../components/Charts/GlobalStatistics";
import RevenueByServiceTypeChart from "../components/Charts/RevenueByServiceTypeChart";
import ServiceTypeChart from "../components/Charts/ServiceTypeChart";
import ServiceTypeChartByYear from "../components/Charts/ServiceTypeChartByYear";
import YearlyBillingChart from "../components/Charts/YearlyBillingChart";
import { getAvailableYears } from "../components/utils"; // Importez la fonction utilitaire
import { useAuth } from "../contexts/AuthContext";


const Dashboard = () => {
  const { currentUser } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    const fetchYears = async () => {
      if (currentUser) {
        const years = await getAvailableYears(currentUser.uid);
        setAvailableYears(years);
      }
    };
    fetchYears();
  }, [currentUser]);

  const handleYearChange = event => {
    setSelectedYear(event.target.value);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper elevation={2} style={{ padding: 20 }}>
          <Typography variant="h6">Filtrer par année</Typography>
          <Select value={selectedYear} onChange={handleYearChange} fullWidth>
            {availableYears.map(year => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <GlobalStatistics />
      </Grid>
      <Grid item xs={12}>
        <AnnualStatistics selectedYear={selectedYear} />
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={2} style={{ padding: 20 }}>
          <Typography variant="h6">Revenu et Statistiques {selectedYear}</Typography>
          <BillingStatisticsChart selectedYear={selectedYear} />
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={2} style={{ padding: 20 }}>
          <Typography variant="h6">Revenu et Statistiques par Année</Typography>
          <YearlyBillingChart />
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={2} style={{ padding: 20 }}>
          <Typography variant="h6">Source des clients</Typography>
          <ClientSourceChart />
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={2} style={{ padding: 20 }}>
          <Typography variant="h6">Type de prestations (Global)</Typography>
          <ServiceTypeChart />
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper elevation={2} style={{ padding: 20 }}>
          <Typography variant="h6">Type de prestations pour {selectedYear}</Typography>
          <ServiceTypeChartByYear selectedYear={selectedYear} />
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper elevation={2} style={{ padding: 20 }}>
          <Typography variant="h6">Revenu par type de prestation</Typography>
          <RevenueByServiceTypeChart />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
