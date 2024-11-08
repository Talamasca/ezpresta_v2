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

const AnnualStatistics = ({ selectedYear }) => {
  const { currentUser } = useAuth();
  const [annualStats, setAnnualStats] = useState({
    totalIncome: 0,
    totalInvoiced: 0,
    averageMonthlyIncomeSelectedYear: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnualStatistics = async () => {
      setIsLoading(true);
      let totalIncome = 0;
      let totalInvoiced = 0;
      const monthlyPayments = new Set();

      try {
        const ordersSnapshot = await getDocs(
          collection(db, `users/${currentUser.uid}/orders`)
        );

        ordersSnapshot.forEach(doc => {
          const order = doc.data();
          const orderDate = new Date(order.selectedDate);

          // Total facturé et encaissé pour l'année sélectionnée
          if (order.paymentDetails) {
            order.paymentDetails.forEach(payment => {
              const paymentDate = new Date(payment.paymentDate);
              if (payment.isPaid && paymentDate.getFullYear() === selectedYear) {
                totalIncome += payment.value;
                monthlyPayments.add(paymentDate.getMonth());
              }
            });
          }

          if (order.orderIsConfirmed && orderDate.getFullYear() === selectedYear) {
            totalInvoiced += order.totalPrice;
          }
        });

        const averageMonthlyIncomeSelectedYear = totalIncome>0 ? totalIncome / 12 : 0;

        setAnnualStats({
          totalIncome,
          totalInvoiced,
          averageMonthlyIncomeSelectedYear
        });
      } catch (error) {
        console.error("Erreur lors de la récupération des statistiques annuelles :", error);
      }

      setIsLoading(false);
    };

    fetchAnnualStatistics();
  }, [currentUser, selectedYear]);

  return isLoading ? (
    <CircularProgress style={{ margin: "auto" }} />
  ) : (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper elevation={2} style={{ padding: 20 }}>
          <Typography variant="h6">Revenu annuel sur {selectedYear}</Typography>
          <Typography variant="h4">{formatCurrency(annualStats.totalIncome)} / {formatCurrency(annualStats.totalInvoiced)}</Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={2} style={{ padding: 20 }}>
          <Typography variant="h6">Revenu Moyen Mensuel ({selectedYear})</Typography>
          <Typography variant="h4">{formatCurrency(annualStats.averageMonthlyIncomeSelectedYear)}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AnnualStatistics;
