import React, { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { collection, getDocs } from "firebase/firestore";

import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";

// Fonction pour générer une couleur unique pour chaque index/type
const generateColor = index => `hsl(${index * 60 % 360}, 70%, 50%)`;

const RevenueByServiceTypeChart = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState([]);
  const [allServiceTypes, setAllServiceTypes] = useState([]);

  useEffect(() => {
    const fetchRevenueData = async () => {
      const typeRevenueByYear = {}; // Structure pour stocker les revenus par type et par année
      const serviceTypesSet = new Set(); // Pour stocker tous les types de services présents dans le catalog

      // Récupération des types de prestations dans la collection `catalog`
      const catalogSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/catalog`));
      const catalogTypeMapping = {};

      catalogSnapshot.forEach(doc => {
        const catalogData = doc.data();
        const type = catalogData.type;
        catalogTypeMapping[doc.id] = type; // Associe chaque `catalog_id` à son `type`
        serviceTypesSet.add(type); // Enregistre tous les types de services
      });

      // Récupération des commandes
      const ordersSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/orders`));

      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        const orderDate = new Date(order.selectedDate);
        const year = orderDate.getFullYear();

        // Vérifier que la commande est confirmée
        if (true === order.orderIsConfirmed) {
          const type = catalogTypeMapping[order.catalog_id] || "Type inconnu";
          let baseRevenue = order.totalPrice || 0;
          // Initialiser l'année et chaque type avec 0 si non existant
          if (!typeRevenueByYear[year]) {
            typeRevenueByYear[year] = {};
            serviceTypesSet.forEach(serviceType => {
              typeRevenueByYear[year][serviceType] = 0;
            });
          }

          // Ajustement pour les frais Photobooth dans les prestations de type "Mariage"
          if (type === "Mariage" && order.fees) {
            order.fees.forEach(fee => {
              if (fee.feeName && fee.feeName.includes("Photobooth")) {
                // Ajouter le montant du frais au type Photobooth
                typeRevenueByYear[year]["Photobooth"] += fee.feeAmount;
                // Soustraire le montant du frais du type Mariage
                baseRevenue -= fee.feeAmount;
              }
            });
          }

          // Ajout du revenu final ajusté pour le type initial (ex. Mariage, Photobooth)
          typeRevenueByYear[year][type] += baseRevenue;
        }
      });

      // Transformation des données pour recharts
      const chartData = Object.entries(typeRevenueByYear).map(([year, types]) => {
        return {
          year,
          ...types
        };
      });

      setData(chartData);
      setAllServiceTypes(Array.from(serviceTypesSet)); // Convertit l'ensemble en tableau pour le mappage des couleurs
    };

    fetchRevenueData();
  }, [currentUser]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip formatter={value => `${value.toFixed(2)} €`} />
        <Legend />
        {allServiceTypes.map((type, index) => (
          <Area
            key={type}
            type="monotone"
            dataKey={type}
            stackId="1"
            stroke={generateColor(index)}
            fill={generateColor(index)}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueByServiceTypeChart;
