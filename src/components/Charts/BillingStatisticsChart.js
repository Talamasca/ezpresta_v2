import React, { useEffect, useState } from "react";
import { Bar, BarChart, Legend, ResponsiveContainer,Tooltip, XAxis, YAxis } from "recharts";

import { collection, getDocs, orderBy,query } from "firebase/firestore";

import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";

const BillingStatisticsChart = ({ selectedYear }) => {
  const { currentUser } = useAuth();
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      const months = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
      ];
      const data = months.map(month => ({
        month,
        invoiced: 0,
        received: 0,
        canceled: 0
      }));

      const ordersSnapshot = await getDocs(
        query(collection(db, `users/${currentUser.uid}/orders`), orderBy("selectedDate"))
      );

      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        const orderDate = new Date(order.selectedDate);
        const orderYear = orderDate.getFullYear();
        const orderMonth = orderDate.getMonth();

        // Montant facturé : pour l'année de la prestation uniquement
        if (orderYear === selectedYear && order.orderIsConfirmed) {
          data[orderMonth].invoiced += order.totalPrice;
        }

        // Montant encaissé : chaque paiement sur l'année du paiement réel
        if (order.paymentDetails) {
          order.paymentDetails.forEach(payment => {
            const paymentDate = new Date(payment.paymentDate);
            const paymentYear = paymentDate.getFullYear();
            const paymentMonth = paymentDate.getMonth();

            // Comptabiliser le paiement si c'est l'année sélectionnée
            if (payment.isPaid && paymentYear === selectedYear) {
              data[paymentMonth].received += payment.value;
            }
          });
        }

        // Montant annulé : pour l'année de la prestation uniquement
        if (orderYear === selectedYear && (order.orderIsCanceled || order.orderIsCanceled === null)) {
          data[orderMonth].canceled += order.totalPrice;
        }
      });

      setMonthlyData(data);
    };

    fetchMonthlyData();
  }, [currentUser, selectedYear]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={monthlyData}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="invoiced" name="Montant facturé" fill="#2eb7ba" />
        <Bar dataKey="received" name="Montant encaissé" fill="#4caf50" />
        <Bar dataKey="canceled" name="Montant annulé" fill="#f44336" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BillingStatisticsChart;
