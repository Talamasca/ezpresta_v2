import React, { useEffect, useState } from "react";
import { Bar, BarChart, Legend, ResponsiveContainer,Tooltip, XAxis, YAxis } from "recharts";

import { collection, getDocs, orderBy,query } from "firebase/firestore";

import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";

const YearlyBillingChart = () => {
  const { currentUser } = useAuth();
  const [yearlyData, setYearlyData] = useState([]);

  useEffect(() => {
    const fetchYearlyData = async () => {
      const data = {};

      const ordersSnapshot = await getDocs(
        query(collection(db, `users/${currentUser.uid}/orders`), orderBy("selectedDate"))
      );

      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        const orderYear = new Date(order.selectedDate).getFullYear();

        // Initialisation de l'année dans l'objet data si elle n'existe pas encore
        if (!data[orderYear]) {
          data[orderYear] = { year: orderYear, invoiced: 0, received: 0 };
        }

        // Montant facturé (basé sur selectedDate)
        if (order.orderIsConfirmed) {
          data[orderYear].invoiced += order.totalPrice;
        }

        // Montant encaissé (basé sur paymentDate dans paymentDetails)
        if (order.paymentDetails) {
          order.paymentDetails.forEach(payment => {
            const paymentYear = new Date(payment.paymentDate).getFullYear();
            if (payment.isPaid) {
              // Initialiser si l'année de paiement n'est pas dans data
              if (!data[paymentYear]) {
                data[paymentYear] = { year: paymentYear, invoiced: 0, received: 0 };
              }
              data[paymentYear].received += payment.value;
            }
          });
        }
      });

      // Transformer l'objet data en tableau pour recharts
      const formattedData = Object.values(data).sort((a, b) => a.year - b.year);
      setYearlyData(formattedData);
    };

    fetchYearlyData();
  }, [currentUser]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={yearlyData}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="invoiced" name="Montant facturé" fill="#2eb7ba" />
        <Bar dataKey="received" name="Montant encaissé" fill="#4caf50" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default YearlyBillingChart;
