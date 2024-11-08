import React, { useEffect, useState } from "react";

import { CircularProgress,Grid, Paper, Typography } from "@mui/material";
import { collection, getDocs } from "firebase/firestore";

import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";

const formatCurrency = value => {
  return new Intl.NumberFormat("fr-FR", {
    currency: "EUR",
    style: "currency"
  }).format(value);
};

const GlobalStatistics = () => {
  const { currentUser } = useAuth();
  const [globalStats, setGlobalStats] = useState({
    totalIncomeAllYears: 0,
    totalInvoicedAllYears: 0,
    averageMonthlyIncome: 0,
    remainingOrders: 0,
    pendingTasks: 0,
    totalClients: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalStatistics = async () => {
      setIsLoading(true);
      let totalIncomeAllYears = 0;
      let totalInvoicedAllYears = 0;
      let remainingOrders = 0;
      let pendingTasks = 0;
      const today = new Date();
      let minDate = new Date();  // Initialiser avec la date actuelle
      let maxDate = new Date(0); // Initialiser avec la plus ancienne date possible

      try {
        const ordersSnapshot = await getDocs(
          collection(db, `users/${currentUser.uid}/orders`)
        );

        ordersSnapshot.forEach(doc => {
          const order = doc.data();
          const orderDate = new Date(order.selectedDate);

          // Calcul pour les prestations restantes
          if (orderDate > today && !order.orderIsCanceled) {
            remainingOrders += 1;
          }

          // Total encaissé et total facturé toutes années confondues
          // Calcul du revenu total encaissé pour toutes les années
          if (order.paymentDetails) {
            order.paymentDetails.forEach(payment => {
              const paymentDate = new Date(payment.paymentDate);
              if (payment.isPaid) {
                totalIncomeAllYears += payment.value;
                
                // Mettre à jour les dates min et max pour les paiements
                minDate = paymentDate < minDate ? paymentDate : minDate;
                maxDate = paymentDate > maxDate ? paymentDate : maxDate;
              }
            });
          }

          if (order.orderIsConfirmed) {
            totalInvoicedAllYears += order.totalPrice;
          }

          if (order.workflow?.tasks) {
            pendingTasks += order.workflow.tasks.filter(task => !task.isDone).length;
          }
        });

        // Calcul du nombre de mois entre minDate et maxDate
        const totalMonths =
          (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
          (maxDate.getMonth() - minDate.getMonth() + 1); // +1 pour inclure le mois de fin

        const clientsSnapshot = await getDocs(
          collection(db, `users/${currentUser.uid}/customers`)
        );
        const totalClients = clientsSnapshot.size;

        const averageMonthlyIncome = totalMonths > 0 ? totalIncomeAllYears / totalMonths : 0;

        setGlobalStats({
          totalIncomeAllYears,
          totalInvoicedAllYears,
          averageMonthlyIncome,
          remainingOrders,
          pendingTasks,
          totalClients
        });
      } catch (error) {
        console.error("Erreur lors de la récupération des statistiques globales :", error);
      }

      setIsLoading(false);
    };

    fetchGlobalStatistics();
  }, [currentUser]);

  return isLoading ? (
    <CircularProgress style={{ margin: "auto" }} />
  ) : (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Paper elevation={2} style={{ padding: 20 }}>
          <Typography variant="h6">Prestations restantes</Typography>
          <Typography variant="h4">{globalStats.remainingOrders}</Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper elevation={2} style={{ padding: 20 }}>
          <Typography variant="h6">Tâches non traitées</Typography>
          <Typography variant="h4">{globalStats.pendingTasks}</Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper elevation={2} style={{ padding: 20 }}>
          <Typography variant="h6">Total clients</Typography>
          <Typography variant="h4">{globalStats.totalClients}</Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={2} style={{ padding: 20 }}>
          <Typography variant="h6">Revenu Total (Toutes Années)</Typography>
          <Typography variant="h4">{formatCurrency(globalStats.totalIncomeAllYears)} / {formatCurrency(globalStats.totalInvoicedAllYears)}</Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={2} style={{ padding: 20 }}>
          <Typography variant="h6">Revenu Moyen Mensuel - Global</Typography>
          <Typography variant="h4">{formatCurrency(globalStats.averageMonthlyIncome)}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default GlobalStatistics;
